// @ts-ignore
export async function filter_async<T>(arr: Array<T>, callback) {
    const fail = Symbol();
    // @ts-ignore
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
}
