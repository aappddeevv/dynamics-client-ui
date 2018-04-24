/** 
 * Attachment point for the callback. Object has "Deferred" type.  Use
 * `mydeferred.promise` to obtain a promise that is completed once `mydeferred`
 * is completed.
 */
export function Deferred<T>() {
    return defer<T>(Object.create(Deferred.prototype))
}

/** 
 * Add resolve, reject, promise to an object.
 */
function defer<T>(deferred)  {
    deferred.promise = new Promise<T>(function (resolve, reject) {
        deferred.resolve = resolve
        deferred.reject = reject
    })
    return deferred
}

export default Deferred
