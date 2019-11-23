import BasePeriod from "../models/base_period.model";
import {Stack} from "./stack";
import * as admin from 'firebase-admin';
import * as config from '../config';
import Timestamp = admin.firestore.Timestamp;

export interface ErrorPeriod {
    reason: string,
    startDate: string,
    endDate: string
}

export interface ParsedPeriods<T> {
    periods: Array<T>,
    errors: Array<ErrorPeriod>
}

export function merge_overlapping_intervals<T extends BasePeriod>(data: Array<T>, maximumEndDate: Date): Array<T> {
    const intervals_stack: Stack<T> = new Stack<T>();

    if (data.length <= 0) {
        return intervals_stack._store;
    }

    if (data[0].endDate > maximumEndDate) {
        data[0].endDate = maximumEndDate;
    }

    intervals_stack.push(data[0]);

    for (let i = 1; i < data.length; i++) {
        const current_interval = data[i];

        const top = intervals_stack.top();

        // @ts-ignore
        if (top.endDate < current_interval.startDate) {

            if (current_interval.endDate > maximumEndDate) {
                current_interval.endDate = maximumEndDate;
            }

            intervals_stack.push(current_interval);
            // @ts-ignore
        } else if (top.endDate < current_interval.endDate) {

            if (current_interval.endDate > maximumEndDate) {
                current_interval.endDate = maximumEndDate;
            }

            // @ts-ignore
            top.endDate = current_interval.endDate;

            intervals_stack.pop();
            // @ts-ignore
            intervals_stack.push(top);
        }
    }

    return intervals_stack._store;
}

function splitSinglePeriodIntoDays<T extends BasePeriod>(period: T): Array<T> {
    const out: Array<T> = new Array<T>();

    if (new Date(period.startDate.getTime() + (config.SPLIT_TIME)) > period.endDate) {
        out.push(period);
        return out;
    } else {
        let tmp_startDate = period.startDate;

        while (tmp_startDate < period.endDate) {

            out.push(<T>{
                startDate: tmp_startDate,
                endDate: period.endDate
            });

            tmp_startDate = new Date(tmp_startDate.getTime() + (config.SPLIT_TIME));
        }
    }

    return out;
}

export function splitPeriodsIntoDays<T extends BasePeriod>(periods: Array<T>, validateModel: (model: T) => string | null): ParsedPeriods<T> {
    let out: Array<T> = new Array<T>();
    const errors: Array<ErrorPeriod> = Array<ErrorPeriod>();

    for (const period of periods) {
        const error = validateModel(period);

        if (error !== null) {
            errors.push(<ErrorPeriod>{
                reason: error,
                startDate: period.startDate.toString(),
                endDate: period.endDate.toString()
            });
        } else {
            out = out.concat(splitSinglePeriodIntoDays(period));
        }
    }

    return <ParsedPeriods<T>>{
        periods: out,
        errors: errors
    };
}

export function filterOutPeriodFromListOfPeriods<T extends BasePeriod, Y extends BasePeriod, RET extends BasePeriod>(free_times: Array<T>, apt: Y): Array<RET> {
    const out: Array<RET> = new Array<RET>();

    for (const freetime of free_times) {
        if (apt.endDate < freetime.startDate || apt.startDate > freetime.endDate) {
            // @ts-ignore
            out.push(freetime);
            continue;
        }
        if (apt.startDate > freetime.startDate) {
            out.push(<RET> {
                startDate: freetime.startDate,
                endDate: apt.startDate
            });
        }
        if (apt.startDate < freetime.startDate) {
            if (apt.endDate > freetime.endDate) {
                continue;
            }
            out.push(<RET> {
                startDate: apt.endDate,
                endDate: freetime.endDate
            });
        }
        else if (apt.endDate < freetime.endDate) {
            out.push(<RET> {
                startDate: apt.endDate,
                endDate: freetime.endDate
            });
        }
    }
    return out
}

export function firestoreTimeStampToDate(timestamp: any): Date {
    return new Timestamp(timestamp._seconds, timestamp._nanoseconds,).toDate();
}
