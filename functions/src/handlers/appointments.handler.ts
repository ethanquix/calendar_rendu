import {AppointmentModel_from_json, AppointmentModel_validateModel} from '../models/appointements.model';
import {CallableContext, HttpsError} from "firebase-functions/lib/providers/https";
import {
    askForAppointment,
    isAppointmentPossible,
    getMyAppointmentDemands,
    getMyAppointmentSent,
    acceptAppointment,
    refuseAppointment,
    getAppointments, cancelAppointmentDemand, cancelAppointment
} from "../services/appointments.service";
import Appointements_demandModel from "../models/appointements_demand.model";
import {CheckAndGetUsername, CheckBody} from "../utils/check_function_body";
import {TSMap} from "typescript-map";

export async function AskForAppointment(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
            ["startDate", "string"],
            ["endDate", "string"],
            ["to", "string"],
            ["infos", "object"]
        ])
    );

    CheckBody(data.infos, new TSMap<string, string>([
        ["desc", "string"],
        ["title", "string"],
    ]));

    data.from = userName;


    const apt = AppointmentModel_from_json(data);

    const errors = AppointmentModel_validateModel(apt);

    if (errors !== null) {
        return new HttpsError("aborted", "", errors)
    }

    const isPossible = await isAppointmentPossible(apt);

    if (!isPossible) {
        return new HttpsError("aborted", "", "Period of time is unavailable")
    }

    return await askForAppointment(<Appointements_demandModel> {
        response: false,
        hasResponded: false,
        apt: apt,
    });
}

export async function GetMyAppointmentDemandsReceived(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    const demands = await getMyAppointmentDemands(userName);

    for (const k of demands.keys()) {
        const d = demands.get(k);
        // @ts-ignore
        d.apt.startDate = d.apt.startDate.toUTCString();
        // @ts-ignore
        d.apt.endDate = d.apt.endDate.toUTCString();
        // @ts-ignore
        demands.set(k, d.apt)
    }

    return demands.toJSON();
}

export async function GetMyAppointmentDemandsSent(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    const sent = await getMyAppointmentSent(userName);

    for (const k of sent.keys()) {
        const d = sent.get(k);
        // @ts-ignore
        d.apt.startDate = d.apt.startDate.toUTCString();
        // @ts-ignore
        d.apt.endDate = d.apt.endDate.toUTCString();
        // @ts-ignore
        sent.set(k, d.apt)
    }

    return sent.toJSON();
}

export async function AcceptAppointment(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
        ["aptID", "string"],
    ]));

    const aptID = data.aptID;

    return await acceptAppointment(userName, aptID);
}

export async function RefuseAppointment(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
        ["aptID", "string"],
    ]));

    const aptID = data.aptID;

    await refuseAppointment(userName, aptID);
}

export async function GetAppointments(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
            ["startDate", "string"],
            ["endDate", "string"],
        ])
    );

    const startDate = data.startDate;
    const endDate = data.endDate;

    const apts = await getAppointments(userName, new Date(startDate), new Date(endDate));

    for (const k of apts.keys()) {
        const d = apts.get(k);
        // @ts-ignore
        d.startDate = d.startDate.toUTCString();
        // @ts-ignore
        d.endDate = d.endDate.toUTCString();
        // @ts-ignore
        apts.set(k, d)
    }

    return apts.toJSON();
}

export async function CancelAppointmentDemand(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
        ["aptID", "string"],
    ]));

    const aptID = data.aptID;

    await cancelAppointmentDemand(userName, aptID);
}

export async function CancelAppointment(data: any, context: CallableContext) {

    const userName = CheckAndGetUsername(context);

    CheckBody(data, new TSMap<string, string>([
        ["aptID", "string"],
    ]));

    const aptID = data.aptID;

    await cancelAppointment(userName, aptID);
}
