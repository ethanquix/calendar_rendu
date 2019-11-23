import * as admin from 'firebase-admin';
import {GeoCollectionReference, GeoFirestore} from 'geofirestore';
import GeoPoint = admin.firestore.GeoPoint;
import * as config from '../config';
import {TSMap} from "typescript-map";

const db = admin.firestore();
const geofirestore: GeoFirestore = new GeoFirestore(db);

export async function updateUserPosition(user: string, latitude: number, longitude: number): Promise<boolean> {
    const geocollection: GeoCollectionReference = geofirestore.collection('users');

    try {
        await geocollection.doc(user).update({
            coordinates: new GeoPoint(latitude, longitude)
        });
        return true;
    } catch (e) {
        return false;
    }
}

export async function getUsersInRange(lat: number, long: number, radius: number): Promise<TSMap<string, any>> {
    const geocollection: GeoCollectionReference = geofirestore.collection(config.NAME_COLLECTION_USERS);

    const query = geocollection.near({
        center: new GeoPoint(lat, long),
        radius: radius
    });

    return (await query.get()).docs.reduce(function (prev, doc) {
        prev.set(doc.id, doc.data());

        return prev;
    }, new TSMap<string, any>())
}
