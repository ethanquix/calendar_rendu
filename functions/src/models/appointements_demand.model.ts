import AppointementsModel, {AppointmentModel_from_FirestoreData as AppointementsModel_fromFirestoreData} from "./appointements.model";

export default interface Appointements_demandModel {
    hasResponded: boolean,
    response: boolean,
    apt: AppointementsModel
}

export function fromFirestoreData(data: any): Appointements_demandModel {
    return <Appointements_demandModel>{
        apt: AppointementsModel_fromFirestoreData(data.apt),
        hasResponded: data.hasResponded,
        response: data.response,
    }
}
