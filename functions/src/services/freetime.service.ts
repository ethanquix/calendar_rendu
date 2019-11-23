import AppointementsModel from "../models/appointements.model";
import BasePeriod from "../models/base_period.model";
import {
    ErrorPeriod,
    filterOutPeriodFromListOfPeriods,
    merge_overlapping_intervals,
    splitPeriodsIntoDays
} from "../utils/periods";
import {getAppointments} from "./appointments.service";
import * as admin from "firebase-admin";
import * as config from "../config";
import Free_periodModel, {
    Free_periodModel_Human,
    Free_periodModel_withID,
    validateModel
} from "../models/free_period.model";
import Timestamp = admin.firestore.Timestamp;

const db = admin.firestore();

export async function postFreeTimes(user: string, periodsData: Array<Free_periodModel>): Promise<Array<ErrorPeriod>> {

    const ref = db.collection(config.NAME_COLLECTION_USERS).doc(user).collection(config.NAME_COLLECTION_FREE_TIME);

    const resultOfSPlit = splitPeriodsIntoDays(periodsData, validateModel);

    const periodsDataAfterSplit = resultOfSPlit.periods;
    const errors = resultOfSPlit.errors;

    let index = 0;
    let batch = db.batch();

    for (const period of periodsDataAfterSplit) {

        if (index % (config.BATCH_MAXIMUM_SIZE - 1) === 0 && index !== 0) {
            index = 0;
            await batch.commit();
            batch = db.batch();
        }

        // const document_ref = ref.doc(period.startDate.valueOf().toString());
        const document_ref = ref.doc();
        batch.set(document_ref, period);
        index += 1;
    }

    if (index > 0) {
        await batch.commit();
    }
    return errors;
}

export function getOnlyPeriodsWithoutAppointments<T extends BasePeriod>(free_times: Array<T>, apts: Array<AppointementsModel>) {
    let out: Array<T> = free_times;
    for (const apt of apts) {
        out = filterOutPeriodFromListOfPeriods(out, apt);
    }
    return out;
}

export async function getFreeTimesWithID(user: string, startDate: Date, endDate: Date): Promise<Array<Free_periodModel_withID>> {
    const startDateMinusOneDay = new Date(startDate.getTime() - (config.SPLIT_TIME));

    const queryForAllFreeTime = db.collection(config.NAME_COLLECTION_USERS)
        .doc(user)
        .collection(config.NAME_COLLECTION_FREE_TIME)

        .where('startDate', '>=', startDateMinusOneDay)
        .where('startDate', '<=', endDate)
        .orderBy('startDate', 'asc');

    const snapshotForAllFreeTime = await queryForAllFreeTime.get();

    return snapshotForAllFreeTime.docs.map(doc => {
        const doc_data = doc.data();
        return {
            startDate: new Timestamp(doc_data.startDate._seconds, doc_data.startDate._nanoseconds,).toDate(),
            endDate: new Timestamp(doc_data.endDate._seconds, doc_data.endDate._nanoseconds,).toDate(),
            id: doc.id
        }
    }).filter(input => {
        const testingStartDate = input.startDate;
        const testingEndDate = input.endDate;

        return (testingStartDate <= startDate && testingEndDate >= endDate) ||
            (testingStartDate >= startDate && testingStartDate <= endDate);
    });
}

export async function getFreeTimes(user: string, startDate: Date, endDate: Date): Promise<Array<Free_periodModel_Human>> {
    const startDateMinusOneDay = new Date(startDate.getTime() - (config.SPLIT_TIME));

    const queryForAllFreeTime = db.collection(config.NAME_COLLECTION_USERS)
        .doc(user)
        .collection(config.NAME_COLLECTION_FREE_TIME)

        .where('startDate', '>=', startDateMinusOneDay)
        .where('startDate', '<=', endDate)
        .orderBy('startDate', 'asc');

    const snapshotForAllFreeTime = await queryForAllFreeTime.get();

    const freeTimeInDateRange = snapshotForAllFreeTime.docs.map(doc => {
        const doc_data = doc.data();
        return {
            startDate: new Timestamp(doc_data.startDate._seconds, doc_data.startDate._nanoseconds,).toDate(),
            endDate: new Timestamp(doc_data.endDate._seconds, doc_data.endDate._nanoseconds,).toDate(),
        }
    }).filter(input => {
        const testingStartDate = input.startDate;
        const testingEndDate = input.endDate;

        return (testingStartDate <= startDate && testingEndDate >= endDate) ||
            (testingStartDate >= startDate && testingStartDate <= endDate);
    });

    const freeTimeInDateRangeWithMergedIntervals = merge_overlapping_intervals(freeTimeInDateRange, endDate);

    const apts = await getAppointments(user, startDate, endDate);

    const free_intervals_after_apts_removal = getOnlyPeriodsWithoutAppointments(freeTimeInDateRangeWithMergedIntervals, apts.values());

    return free_intervals_after_apts_removal.map(period => {
        return <Free_periodModel_Human>{
            startDate: period.startDate.toUTCString(),
            endDate: period.endDate.toUTCString(),
        }
    })
}

function reducePeriod(src: Free_periodModel_withID, reducer: BasePeriod, batch: admin.firestore.WriteBatch, index: number, ref: any): number {

    let next_index = index;

    if (src.endDate <= reducer.startDate || src.startDate >= reducer.endDate) {
        return next_index;
    }

    if (src.startDate < reducer.startDate && src.endDate > reducer.endDate) {
        batch.update(ref.doc(src.id), {
            endDate: reducer.startDate
        });
        batch.create(ref.doc(), {
            startDate: reducer.endDate,
            endDate: src.endDate
        });
        next_index += 3;
        return next_index;
    }

    if (src.startDate > reducer.startDate) {
        if (src.endDate <= reducer.endDate) {
            batch.delete(ref.doc(src.id));
        } else {
            batch.update(ref.doc(src.id), {
                startDate: reducer.endDate
            });
        }
        next_index += 1;
    } else {
        batch.update(ref.doc(src.id), {
            endDate: reducer.startDate
        });
        next_index += 1;
    }

    return next_index;
}

export async function deleteFreeTimes(user: string, period: BasePeriod) {
    let batch = db.batch();
    const ref = db.collection(config.NAME_COLLECTION_USERS).doc(user).collection(config.NAME_COLLECTION_FREE_TIME);

    const free_time = await getFreeTimesWithID(user, period.startDate, period.endDate);

    let index = 0;
    for (const ft of free_time) {

        if (index % (config.BATCH_MAXIMUM_SIZE - 4) === 0 && index !== 0) {
            await batch.commit();
            batch = db.batch();
            index = 0;
        }

        index = reducePeriod(ft, period, batch, index, ref);
    }

    if (index > 0) {
        await batch.commit();
    }
}

