import {TSMap} from "typescript-map"
import AppointementsModel, {
    AppointmentModel_from_FirestoreData,
    AppointmentModel_validateModel
} from "../models/appointements.model";
import {ErrorPeriod, splitPeriodsIntoDays} from "../utils/periods";
import * as admin from "firebase-admin";
import Appointements_demandModel, {fromFirestoreData as Appointements_demandModel_fromFirestoreData} from "../models/appointements_demand.model";
import {getFreeTimes} from "./freetime.service";
import * as config from "../config";
import {HttpsError} from "firebase-functions/lib/providers/https";

const db = admin.firestore();

const BATCH_MAXIMUM_SIZE = 500;

export async function getAppointments(userRef: string, startDate: Date, endDate: Date): Promise<TSMap<string, AppointementsModel>> {
    const startDateMinusOneDay = new Date(startDate.getTime() - (1000 * 60 * 60 * 24));

    const result = db.collection('users')
        .doc('dimitri')
        .collection('appointments')

        .where('startDate', '>=', startDateMinusOneDay)
        .where('startDate', '<=', endDate)
        .orderBy('startDate', 'asc');

    const snapshot = await result.get();

    const mapOfData = snapshot.docs.reduce(function (prev, doc) {
        const doc_data = doc.data();
        prev.set(doc.id, AppointmentModel_from_FirestoreData(doc_data));

        return prev;
    }, new TSMap<string, AppointementsModel>());

    return mapOfData.filter(input => {
        const testingStartDate = input.startDate;
        const testingEndDate = input.endDate;

        return (testingStartDate <= startDate && testingEndDate >= endDate) ||
            (testingStartDate >= startDate && testingStartDate <= endDate);
    });
}

export async function askForAppointment(apt: Appointements_demandModel) {
    const ref = db.collection(config.NAME_COLLECTION_APPOINTMENTS_DEMANDS).doc();

    await ref.create(apt);

    return true;
}

export async function getMyAppointmentDemands(user: string): Promise<TSMap<string, Appointements_demandModel>> {
    const data = await db.collection(config.NAME_COLLECTION_APPOINTMENTS_DEMANDS)
        .where("apt.to", "==", user)
        .where("hasResponded", "==", false)
        .get();

    return data.docs.reduce(function (prev, doc) {
        const doc_data = doc.data();
        prev.set(doc.id, Appointements_demandModel_fromFirestoreData(doc_data));

        return prev;
    }, new TSMap<string, Appointements_demandModel>())
}

export async function getMyAppointmentSent(user: string) {
    const data = await db.collection("appointments_demands")
        .where("apt.from", "==", user)
        .where("hasResponded", "==", false)
        .get();

    return data.docs.reduce(function (prev, doc) {
        const doc_data = doc.data();
        prev.set(doc.id, Appointements_demandModel_fromFirestoreData(doc_data));

        return prev;
    }, new TSMap<string, Appointements_demandModel>())
}

export async function acceptAppointment(user: string, aptID: string): Promise<Array<ErrorPeriod> | null> {
    const apt_db = await db.collection("appointments_demands").doc(aptID).get();

    if (!apt_db.exists) {
        throw new HttpsError("aborted", "", "Appointment don't exist")
    }

    const apt: Appointements_demandModel = Appointements_demandModel_fromFirestoreData(apt_db.data());

    if (apt.apt.to !== user) {
        throw new HttpsError("permission-denied", "")
    }

    apt.hasResponded = true;
    apt.response = true;

    const resultOfPostAppointment = await postAppointment(apt.apt);

    if (resultOfPostAppointment !== null) {
        return resultOfPostAppointment;
    }

    await db.collection("appointments_demands").doc(aptID).update(apt);
    return null;
}

export async function refuseAppointment(user: string, aptID: string) {
    const apt_db = await db.collection("appointments_demands").doc(aptID).get();

    if (!apt_db.exists) {
        throw new HttpsError("aborted", "", "Appointment don't exist")
    }

    const apt: Appointements_demandModel = Appointements_demandModel_fromFirestoreData(apt_db.data());

    if (apt.apt.to !== user) {
        throw new HttpsError("permission-denied", "")
    }

    apt.hasResponded = true;
    apt.response = false;

    await db.collection("appointments_demands").doc(aptID).update(apt);
}

export async function isAppointmentPossible(appointment: AppointementsModel): Promise<boolean> {
    const free_times = await getFreeTimes(appointment.to, appointment.startDate, appointment.endDate);

    for (const period of free_times) {
        if (appointment.startDate >= new Date(period.startDate) && (appointment.endDate <= new Date(period.endDate))) {
            return true;
        }
    }
    return false;
}

export async function postAppointment(appointment: AppointementsModel): Promise<Array<ErrorPeriod> | null> {
    const ref = db.collection('users');

    // @ts-ignore
    const error = AppointmentModel_validateModel(appointment);
    if (error === null) {

        const isPossible = isAppointmentPossible(appointment);

        if (isPossible) {
            const resultOfSPlit = splitPeriodsIntoDays(new Array<AppointementsModel>(appointment), AppointmentModel_validateModel);
            const periodsData = resultOfSPlit.periods;
            const errors = resultOfSPlit.errors;

            let index = 0;
            let batch = db.batch();
            for (const period of periodsData) {

                if (index % (BATCH_MAXIMUM_SIZE - 2) === 0 && index !== 0) {
                    index = 0;
                    await batch.commit();

                    batch = db.batch();
                }

                const refTo = ref.doc(period.to).collection("appointments").doc();
                const refFrom = ref.doc(period.from).collection("appointments").doc();

                batch.set(refTo, period);
                batch.set(refFrom, period);
                index += 2;
            }

            if (index > 0) {
                await batch.commit();
            }

            return errors;
        } else {
            return new Array(<ErrorPeriod>{
                reason: "Planning not free",
                startDate: appointment.startDate.toUTCString(),
                endDate: appointment.endDate.toUTCString()
            });
        }

    } else {
        return new Array(<ErrorPeriod>{
            reason: error,
            startDate: appointment.startDate.toUTCString(),
            endDate: appointment.endDate.toUTCString()
        });
    }
}

export async function cancelAppointmentDemand(user: string, aptID: string) {
    const apt_db = await db.collection(config.NAME_COLLECTION_APPOINTMENTS_DEMANDS).doc(aptID).get();

    if (!apt_db.exists) {
        throw new HttpsError("aborted", "", "Appointment don't exist")
    }

    const apt: Appointements_demandModel = Appointements_demandModel_fromFirestoreData(apt_db.data());

    if (apt.apt.from !== user) {
        throw new HttpsError("permission-denied", "")
    }

    await db.collection("appointments_demands").doc(aptID).delete();
}

export async function cancelAppointment(user: string, aptID: string) {
    let apt_db = null;
    try {
        apt_db = await db.collection(config.NAME_COLLECTION_USERS).doc(user).collection(config.NAME_COLLECTION_APPOINTMENTS).doc(aptID).get();
    } catch (e) {
        throw new HttpsError("aborted", "", "Appointment don't exist")
    }
    if (!apt_db.exists) {
        throw new HttpsError("aborted", "", "Appointment don't exist")
    }

    const apt: AppointementsModel = AppointmentModel_from_FirestoreData(apt_db.data());

    if (!(apt.from === user || apt.to === user)) {
        throw new HttpsError("permission-denied", "")
    }

    const other_user_name = apt.from === user ? apt.to : apt.from;
    const user_is_to_or_from = apt.to === user ? "to" : "from";
    const other_user_is_to_or_from = user_is_to_or_from === "from" ? "to" : "from";

    //Delete apt for the other user
    const apt_db_other = await db.collection(config.NAME_COLLECTION_USERS).doc(other_user_name).collection(config.NAME_COLLECTION_APPOINTMENTS)
        .where(user_is_to_or_from, "==", user)
        .where(other_user_is_to_or_from, "==", other_user_name)
        .where("startDate", "==", apt.startDate)
        .where("endDate", "==", apt.endDate)
        .where("infos.desc", "==", apt.infos.desc)
        .where("infos.title", "==", apt.infos.title)
        .get();

    if (apt_db_other.empty) {
        throw new HttpsError("aborted", "", "Appointment don't exist")
    }

    const apt_other = apt_db_other.docs[0];

    await db.collection(config.NAME_COLLECTION_USERS).doc(user).collection(config.NAME_COLLECTION_APPOINTMENTS).doc(aptID).delete();
    await db.collection(config.NAME_COLLECTION_USERS).doc(other_user_name).collection(config.NAME_COLLECTION_APPOINTMENTS).doc(apt_other.id).delete()
}
