import {CallableContext, HttpsError} from "firebase-functions/lib/providers/https";
import {TSMap} from "typescript-map";

function check_for_missing_arguments(body: any, checkfor: TSMap<string, string>): TSMap<string, string> {
    const out: TSMap<string, string> = new TSMap<string, string>();

    checkfor.forEach((value, key) => {
        //is present
        // @ts-ignore
        if (!(key in body)) {
            // @ts-ignore
            out.set(key, "missing");
            return;
        }

        //is same type
        // @ts-ignore
        if (typeof body[key] !== value) {
            // @ts-ignore
            out.set(key, "type should be " + value + " and is " + typeof body[key])
        }
    });

    return out;
}

export function CheckAndGetUsername(context: CallableContext): string {
    // @ts-ignore
    if (!context.auth || !(context.auth.uid)) {
        throw new HttpsError("unauthenticated", "Request had invalid credentials.", {});
    }
    // @ts-ignore
    return context.auth.uid;
}

export function CheckBody(body: any, checkfor: TSMap<string, string>) {
    const errors = check_for_missing_arguments(body, checkfor);

    if (errors.length > 0) {
        throw new HttpsError("invalid-argument", "Request had invalid or missing arguments.",
            errors.toJSON());
    }
}
