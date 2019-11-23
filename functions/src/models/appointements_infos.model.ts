
export default interface Appointements_infosModel {
    title: string,
    desc: string,
}

export function validateModel(model: Appointements_infosModel): string | null {
    return null
}

export function Appointements_infosModel_from_FirestoreData(data: any): Appointements_infosModel {
    return <Appointements_infosModel> {
        title: data.title,
        desc: data.desc,
    }
}
