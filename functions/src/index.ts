import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as config from "./config";
import {CallableContext} from "firebase-functions/lib/providers/https";

admin.initializeApp();

import {
    DeleteFreeTimes,
    GetFreeTimes, GetMyFreeTimes, PostFreeTime
} from './handlers/freetime.handler';
import {
    AskForAppointment,
    GetMyAppointmentDemandsReceived,
    GetMyAppointmentDemandsSent,
    AcceptAppointment,
    RefuseAppointment,
    GetAppointments, CancelAppointmentDemand, CancelAppointment
} from './handlers/appointments.handler';

import {UpdateUserPosition} from './handlers/users.handler'


//Free Time
        exports.createFreeTimes = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 540,
                memory: "2GB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await PostFreeTime(data, context)
        });

        exports.getMyFreeTimes = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 540,
                memory: "2GB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
                return await GetMyFreeTimes(data, context)
            });

        exports.getFreeTimes = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 540,
                memory: "2GB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await GetFreeTimes(data, context)
        });

        exports.deleteFreeTimes = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 540,
                memory: "2GB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            await DeleteFreeTimes(data, context)
        });

//Apts
        exports.askForAppointment = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await AskForAppointment(data, context)
        });

        exports.getMyAppointmentDemandsReceived = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await GetMyAppointmentDemandsReceived(data, context);
        });

        exports.getMyAppointmentDemandsSent = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await GetMyAppointmentDemandsSent(data, context);
        });

        exports.acceptAppointment = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await AcceptAppointment(data, context)
        });

        exports.refuseAppointment = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            await RefuseAppointment(data, context)
        });

        exports.cancelAppointmentDemand = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            await CancelAppointmentDemand(data, context)
        });

        exports.cancelAppointment = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            await CancelAppointment(data, context)
        });

        exports.getAppointments = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await GetAppointments(data, context)
        });

//User
        exports.updateUserPosition = functions
            .region(config.FIREBASE_REGION)
            .runWith(<functions.RuntimeOptions> {
                timeoutSeconds: 60,
                memory: "128MB"
            })
            .https.onCall(async (data: any, context: CallableContext) => {
            return await UpdateUserPosition(data, context);
        });
