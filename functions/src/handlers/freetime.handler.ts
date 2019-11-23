import Free_periodModel, {
    Free_periodModel_from_JSON,
    Free_periodModel_Human,
} from '../models/free_period.model';
import {deleteFreeTimes, getFreeTimes, postFreeTimes} from "../services/freetime.service";
import {CallableContext, HttpsError} from "firebase-functions/lib/providers/https";
import {getUsersInRange} from '../services/users.service';
import {TSMap} from "typescript-map";
import {CheckAndGetUsername, CheckBody} from '../utils/check_function_body';
import * as config from "../config";

export async function PostFreeTime(data: any, context: CallableContext) {
    const periodsData: Array<Free_periodModel> = new Array<Free_periodModel>();

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
            ["periods", "object"],
        ])
    );

    const periods = data.periods;

    if (!(periods instanceof Array)) {
        throw new HttpsError("invalid-argument", "Request had invalid or missing arguments.",
            "periods should be an array");
    }

    periods.map((val: Free_periodModel) => {
        CheckBody(val, new TSMap<string, string>([
                ["startDate", "string"],
                ["endDate", "string"],
            ])
        );

        periodsData.push(<Free_periodModel>{
            startDate: new Date(val.startDate),
            endDate: new Date(val.endDate),
        });
    });

    return await postFreeTimes(userName, periodsData);

}

export async function GetMyFreeTimes(data: any, context: CallableContext): Promise<{ [key: string]: Array<Free_periodModel_Human> }> {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
            ["startDate", "string"],
            ["endDate", "string"],
        ])
    );

    const out: TSMap<string, Array<Free_periodModel_Human>> = new TSMap<string, Array<Free_periodModel_Human>>();


    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    //Get free times of user
    const free_time_of_user = await getFreeTimes(userName, startDate, endDate);

    //If there is any free times, add it to the output
    if (free_time_of_user.length > 0) {
        out.set(userName, free_time_of_user);
    }
    return out.toJSON();
}


export async function GetFreeTimes(data: any, context: CallableContext): Promise<{ [key: string]: Array<Free_periodModel_Human> }> {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
            ["startDate", "string"],
            ["endDate", "string"],
            ["lat", "number"],
            ["long", "number"]
        ])
    );

    const out: TSMap<string, Array<Free_periodModel_Human>> = new TSMap<string, Array<Free_periodModel_Human>>();


    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const lat: number = data.lat;
    const long: number = data.long;

    let radius = data.radius;

    if (!("radius" in data)) {
        radius = config.DEFAULT_RADIUS;
    }

    //1 Get all users in this range.
    const usersInRange = await getUsersInRange(lat, long, radius);

    //Loop all users
    for (const userKey of usersInRange.keys()) {

        //Skip user if its the current user
        if (userKey === userName) {
            continue;
        }

        //Get free times of user
        const free_time_of_user = await getFreeTimes(userKey, startDate, endDate);

        //If there is any free times, add it to the output
        if (free_time_of_user.length > 0) {
            out.set(userKey, free_time_of_user);
        }
    }
    return out.toJSON();
}

export async function DeleteFreeTimes(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
            ["periods", "object"],
        ])
    );

    const periods = data.periods;

    if (!(periods instanceof Array)) {
        throw new HttpsError("invalid-argument", "Request had invalid or missing arguments.",
            "periods should be an array");
    }

    periods.map((val: Free_periodModel) => {
        CheckBody(val, new TSMap<string, string>([
                ["startDate", "string"],
                ["endDate", "string"],
            ])
        );
    });

    periods.map(async (val: Free_periodModel) => {
        await deleteFreeTimes(userName, Free_periodModel_from_JSON(val));
    })

}
