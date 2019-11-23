import BasePeriod from './base_period.model'

// tslint:disable-next-line:no-empty-interface
export default interface Free_periodModel extends BasePeriod {
}

export interface Free_periodModel_withID extends Free_periodModel {
    id: string
}

export function Free_periodModel_from_JSON(data: any): Free_periodModel {
    return <Free_periodModel> {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
    }
}

export function validateModel(model: Free_periodModel): string | null {
    if (model.startDate > model.endDate) {
        return "Start date is after end date";
    }
    return null
}

export interface Free_periodModel_Human {
    startDate: string,
    endDate: string,
}
