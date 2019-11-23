import {CallableContext} from "firebase-functions/lib/providers/https";

import {updateUserPosition} from '../services/users.service'
import {CheckAndGetUsername, CheckBody} from "../utils/check_function_body";
import {TSMap} from "typescript-map";

export async function UpdateUserPosition(data: any, context: CallableContext): Promise<boolean> {

    const userName = CheckAndGetUsername(context);

    CheckBody(data ,new TSMap<string, string>([
            ["lat", "number"],
            ["long", "number"],
        ])
    );

    const lat: number = data.lat;
    const long: number = data.long;

    return await updateUserPosition(userName, lat, long);
}
