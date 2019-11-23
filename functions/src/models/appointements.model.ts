import BasePeriod from "./base_period.model";
import Appointements_infosModel, {Appointements_infosModel_from_FirestoreData} from "./appointements_infos.model";
import {firestoreTimeStampToDate} from "../utils/periods";

export default interface AppointementsModel extends BasePeriod {
    from: string,
    to: string,
    infos: Appointements_infosModel,
}

export function AppointmentModel_validateModel(model: AppointementsModel): string | null {
    if (model.startDate > model.endDate) {
        return "Start date is after end date";
    }
    if (!model.from || !model.to) {
        return "From or To are null / undefined"
    }
    return null
}

export function AppointmentModel_from_FirestoreData(data: any): AppointementsModel{
    return <AppointementsModel> {
        from: data.from,
        to: data.to,
        infos: Appointements_infosModel_from_FirestoreData(data.infos),
        endDate: firestoreTimeStampToDate(data.endDate),
        startDate: firestoreTimeStampToDate(data.startDate),
    }
}

export function AppointmentModel_from_json(data: any): AppointementsModel {
    return <AppointementsModel> {
        from: data.from,
        to: data.to,
        infos: Appointements_infosModel_from_FirestoreData(data.infos),
        endDate: new Date(data.endDate),
        startDate: new Date(data.startDate),
    }
}
