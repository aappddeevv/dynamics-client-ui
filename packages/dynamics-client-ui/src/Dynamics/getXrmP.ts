/** Kept as a separate module to make bundling easier. */
import { XRM } from "./xrm"

/**
 * Get Xrm from a Promise. Uses polling to wait for
 * Xrm to become available. Default polling lasts 60 seconds
 * every 1/2 second. This only checks for Xrm on the parent window
* it does *not* walk the window hierarchy.
 */
export function getXrmP(maxIter: number = 120, delta: number = 500,
    getXrm: () => XRM = () => (window.parent.Xrm as XRM)): Promise<XRM> {
    return wait(() => {
        const x = getXrm()
        return typeof x !== "undefined"
    },
        maxIter, delta).then(() => getXrm())
}

/**
 * Get FormContext as a promise either from Xrm.Page or through the
 * FormContextHolder. You do not need this if you are writing
 * a simple form script because you can get the FormContext directly
 * by instructing the Form to call an onLoad function directly with the FormContext.
 * You mostly use this in WebResources.
 */
export function getFormContextP(maxIter: number = 120, delta: number = 500): Promise<Xrm.FormContext> {
    const fchP = wait(() => {
        const tmp = (window.parent as any)
        return typeof tmp.FormContextP !== "undefined"
    }, maxIter, delta).then(() => (window.parent as any).FormContextP as Xrm.FormContext)

    const parentP = wait(() => {
        const x = (window.parent.Xrm as XRM)
        return x && (typeof x.Page !== "undefined")
    }, maxIter, delta).then(() => (window.parent.Xrm as XRM).Page)

    return Promise.race([parentP, fchP])
}

/** Wait for some condition to be true. Uses polling (setInterval) to iterate. */
export function wait(cond: (iteration: number) => boolean, maxIter: number,
    delta: number): Promise<void> {
    if (maxIter <= 0 || delta <= 0) throw Error("maxIter and delta must be > 0")
    return new Promise<void>(function (resolve, reject) {
        let count = 0
        const cancellable = setInterval(function () {
            if (count > maxIter) reject(null)
            count = count + 1
            const proceed = cond(count)
            if (proceed) {
                clearInterval(cancellable)
                resolve()
            }
        }, delta)
    })
}
