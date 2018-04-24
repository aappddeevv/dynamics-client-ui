const R = require("ramda")
export * from "./getXrmP"
import { XRM } from "./xrm"
import { DEBUG } from "BuildSettings"
import { createCipher } from 'crypto';

/**
 * Get a URL parameter from `search` or `document.location.search` by
 * default. This is useful for obtaining the "data" parameter from the URL
 * that is passed in from a form if you set the WebResource url properties.
 * Sometimes the API does not seem to work, but this seems to always work.
 */
export function getURLParameter(name: string, search: string = document.location.search): string | null {
    search = search || ""
    const r: Array<string> | null = new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(search)
    const r2: Array<string> = ["", ""]
    return decodeURIComponent((r || r2)[1].replace(/\+/g, "%20")) || null;
}

/**
 * You can get appId from `getURLParameter("appid", window.parent.parent.document.location.search)`
 * of the current page.
 * baseURL can come from `Xrm.Utility.getGlobalContext().getClientUrl()`.
 * appid, if you are in a WebResource, is 2 levels up.
 */
export interface OpenEntityFormProps {
    entityName: string
    entityId: string
    formId: string
    appId: string
    baseURL: string
    navbar: boolean
    cmdbar: boolean
    /** Not used. */
    extraqs: any
}

/**
 * Try to construct a robust URL that opens to an entity form.
 * @see https://msdn.microsoft.com/en-us/library/gg328483.aspx
 * @param props Props to grab values from.
 */
export function makeOpenEntityFormURL(props: Partial<OpenEntityFormProps>): string {
    const navbar = ((typeof props.navbar === "undefined") ? false : !!props.navbar) ?
        `&${!!props.navbar}` : ""
    const cmdbar = ((typeof props.cmdbar === "undefined") ? false : !!props.cmdbar) ?
        `&${props.cmdbar}` : ""
    const appId = (typeof props.appId === "undefined" || props.appId === "") ? "" : `&appid=${props.appId}`

    return `${props.baseURL}/main.aspx?etn=${props.entityName}${appId}&pagetype=entityrecord&id=%7B${props.entityId}%7D${navbar}${cmdbar}`
}

/** Generate a unique id with an optional prefix. */
export function generateId(prefix: string = "") {
    return `${prefix}-${uuidv4()}`
}

const dec2hex: string[] = [];
for (let i = 0; i <= 15; i++) {
    dec2hex[i] = i.toString(16);
}

const UUID = () => {
    let uuid = ""
    for (let i = 1; i <= 36; i++) {
        if (i === 9 || i === 14 || i === 19 || i === 24) {
            uuid += "-"
        } else if (i === 15) {
            uuid += 4
        } else if (i === 20) {
            uuid += dec2hex[(Math.random() * 4 | 0 + 8)]
        } else {
            uuid += dec2hex[(Math.random() * 15 | 0)]
        }
    }
    return uuid;
}

/** Probably need something multi-browser friendly here. */
//export function uuidv4(): string {
//  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
//    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
//  )
//}
export function uuidv4(): string {
    return UUID()
}

/** Internal to this module. ... */
function cleanId(id: string): string {
    if (typeof id === "undefined" || id === null) throw Error(`Unable to clean nil id ${id}`)
    return id.toString().replace(/[{}]/g, "").toLowerCase()
}

/** Uses internal API. */
export function isUci(xrm: XRM): boolean {
    if (xrm.Internal && xrm.Internal.isUci)
        return xrm.Internal.isUci()
    return false
}

let _isElectron: boolean = false

const userAgent = navigator.userAgent.toLowerCase();
if (userAgent.indexOf(" electron/") > -1) {
    _isElectron = true
}

/** Return true if we are running inside electron. */
export function isElectron(): boolean {
    return _isElectron
}

/**
 * Checks the form context to see if there is an entity id. If not,
 * it's probably a new form.
 */
export function hasEntityId(xrm: XRM | null): boolean {
    if (!xrm) return false
    const id = entityIdOrNull(xrm)
    if (id) return true
    return false
}

/**
 * Return the entity id on the page context or null. Braces removed.
 * @todo Need to use formContext not Page.
 */
export function entityIdOrNull(xrm: XRM | null): string | null {
    if (!xrm) return null
    const e = eaccess(xrm)
    if (e) return cleanId(e.getId())
    return null
}

const eaccess = R.pathOr(null, ["Page", "data", "entity"])

/**
 * After a save event, run actionToTake if ready returns true. Uses polling.
 * Once actionToTake is run, the polling is removed. An exception thrown in
 * in ready is considered a false return.
 * @param xrm Xrm to attach to Xrm.Page.data.entity.addOnSave/removeOnSave
 * @param ready Return true if the condition to run actionToTake has been met.
 * @param actionToTake The action to take.
 * @param pollInterval The interval to poll that ready is true after the save has occurred.
 * @return A cancellable thunk.
 *
 * @todo Move this to FormManagement.
 */
export function runAfterSave(xrm: XRM,
    ready: (x?: XRM) => boolean | null | undefined,
    actionToTake: (x?: XRM) => void,
    pollInterval: number = 500): () => void {
    let cancellable: any | null = null
    const onSaveHandler = (ctx) => {
        const keepChecking = () => {
            try {
                const fire = ready(xrm)
                if (fire) {
                    xrm.Page.data.entity.removeOnSave(onSaveHandler)
                    clearInterval(cancellable)
                    actionToTake(xrm)
                }
            } catch (e) {
                // do nothing
                console.log("Ready check failed", e)
            }
        }
        cancellable = setInterval(keepChecking, pollInterval)
    }
    xrm.Page.data.entity.addOnSave(onSaveHandler)
    return () => xrm.Page.data.entity.removeOnSave(onSaveHandler)
}

/** Render a null, which in react means no rendering. */
export const RenderNothing = () => null

/** Do nothing. */
export function noop() { }

/**
 * If cb is a function, return it, otherwise noop.
 * @param cb Callback
 */
export function callbackOrNoop(cb) {
    return typeof cb === "function" ? cb : noop
}

/**
 * If arg is an array, return the first element if it exists,
 * otherwise, return other.
 */
export function firstOrElse<I = any, O = I>(arg: Array<I> | I, other: O): I | O {
    const x: any = Array.isArray(arg) ? arg[0] : arg
    if (R.isNil(x) && other) return other
    else return x
}

/** Find the first undefined array element or return undefined. */
export function firstUndefined(...args) {
    if (!Array.isArray(args)) return undefined
    return args.find(a => typeof a !== "undefined")
}

/**
 * Execute fns with the same args in order until
 * `event.preventDefault()` is called. This is really
 * just a takeWhile and map where "event" is mutable state.
 */
export function composeEventHandlers(...fns) {
    return (event, ...args) => {
        fns.some(fn => { // does this test in array order???
            fn && fn(event, ...args)
            return event.defaultPrevented
        })
    }
}

/** Per downshift, (p)react. */
export function isDOMElement(el) {
    if (el) {
        if (el.nodeName) return typeof el.nodeName === "string"
        else return (typeof el.type === "string" ||
            typeof el.type === "function")
    }
    return false
}

/** Return true if its a number. */
export function isNumber(thing) {
    // eslint-disable-next-line no-self-compare
    return thing === thing && typeof thing === "number"
}

/**
 * Get props for (p)react.
 */
export function getElementProps(element) {
    return element.props || element.attributes
}

/**
 * Return the parent's Xrm from window.parent.Xrm or window.Xrm.
 * No check to see if Xrm.Page.data is present as that is deprecated.
* This is a strict value check, no async.
 *
 * @see getXrmForEntity
 */
export function getXrm(): XRM | null {
    return (window.parent.Xrm as XRM) || (window.Xrm as XRM)
}

/**
 * Return the global context from GetGlobalContext(), then
 * Xrm.Utility.getGlobalContext() then Xrm.Page.context.
 * Throws Error if not found.
 *
 * @see https://msdn.microsoft.com/pt-pt/library/af74d417-1359-4eaa-9f87-5b33a8852e83(v=crm.7)
 */
export function getGlobalContext(): Xrm.GlobalContext {
    var errorMessage = "Context is not available.";
    if (typeof GetGlobalContext !== "undefined") { return GetGlobalContext() }
    else {
        if (typeof Xrm !== "undefined") {
            if (typeof Xrm.Utility !== "undefined" &&
                typeof Xrm.Utility.getGlobalContext !== "undefined") {
                return Xrm.Utility.getGlobalContext()
            }
            // Try this...
            return Xrm.Page.context
        }
        else { throw new Error(errorMessage) }
    }
}

/**
 * Walk the window chain looking for Xrm with Xrm.Page.data attribute being
 * non-null. Return null if not found. It will walk the window hierarchy
 * as well as test some well known locations of Xrm.
 *
 * @see getXrm
 */
export function getXrmForEntity(): XRM | null {
    const window: Window | null = walkParents({
        select: (w: Window) =>
            R.pathOr(false, ["Xrm", "Page", "data"], w)
    })
    if (window) return window.Xrm as XRM
    const maybeXrm = getXrm()
    if (R.pathOr(false, ["Page", "data"], maybeXrm)) return maybeXrm
    return null
}

/**
 * Run a thunk up the window chain. Return the last window visited if it meets
 * select criteria (if provided) or if select returns true for a particular
 * window.  Return null otherwise. Thunk is usually used for logging.
 */
export function walkParents({ thunk, select, max }: {
    thunk?: (w: Window) => void
    select: (w: Window) => boolean
    max?: number
}): Window | null {
    max = max || 10
    let current: Window | null = window // this window
    while (current && max > 0 && !select(current)) {
        if (thunk) thunk(current)
        max = max - 1
        if (current.parent === current)
            current = null
        else
            current = current.parent
    }
    if (select(current!)) return current
    return null
}

/**
 * Try to get entityid, userid, entity name, entity type code (number) from a
 * variety of places including the Xrm values and the URL parameters in the
 * document that the function is called from. Varibles that are found are
 * returned but if something is not found it is not returned.  If its a new
 * entity, obviously, the entityid will not be present.  Return an object with
 * {userId, entityId, entityName, entityTypeCode}. Note that entityTypeCode
 * is specific to an organization so do not use it if you can avoid it.
 *
 * Should typecode be number or string?
 */
export function getEntityInfo(xrm?: XRM | null): {
    userId?: string
    entityId?: string
    entityName?: string
    entityTypeCode?: number
} {
    const x = xrm || getXrmForEntity()
    const context = R.pathOr(null, ["Page", "context"], x)
    const entity = R.pathOr(null, ["Page", "data", "entity"], x)
    const etn = getURLParameter("etn")
    const typename = getURLParameter("typename")
    const etc = context ? parseInt(context.getQueryStringParameters().etc) : null

    const eid = (entity && entity.getId()) || getURLParameter("id") || null
    const uid = (context && context.getUserId()) || null
    const ename = entity ? entity.getEntityName() :
        (etn ? etn :
            (typename ? typename : null))
    const tcode: number | null = etc

    const rval = {
        ...(uid ? { userId: cleanId(uid) } : {}),
        ...(eid ? { entityId: cleanId(eid) } : {}),
        ...(ename ? { entityName: ename } : {}),
        ...(tcode ? { entityTypeCode: tcode } : {})
    }
    return rval
}

/**
 * Access page context to return form type.
 * @deprecated Use XRM members directly.
 */
export function getFormType(xrm: XRM): XrmEnum.FormType {
    const v = xrm.Page.ui.getFormType()
    // check range???
    return v as XrmEnum.FormType
}

/** If create form, checks formtype and whether there is an id. */
export function isCreateForm(xrm: XRM): boolean {
    return getFormType(xrm) === XrmEnum.FormType.Create || !eaccess(xrm).getId()
}


/**
 * Load scripts programmatically. The script is evaluated once loaded by the browser/host.
 */
export function loadScripts(scripts: Array<string>,
    callback: () => void,
    targetDoc: Document = document) {
    const loader = (src: string, handler: () => void) => {
        if (DEBUG) console.log("Programmatically loading: " + src)
        const script = targetDoc.createElement("script")
        script.src = src
        script.onload = () => {
            // remove onload handler??
            handler()
        }
        const head = targetDoc.getElementsByTagName("head")[0];
        (head || targetDoc.body).appendChild(script)
    }
    // Run on each script...
    (function run() {
        if (scripts.length > 0) {
            loader(scripts.shift()!, run)
        } else if (callback) callback()
    })()
}

/**
 * Catch any errors, print it out, then rethrow (by default).
 * Helps you detect when you are throwing but someone is silently swallowing the exception.
 */
export function catchNonFatal<T>(f: () => T,
    recoverWith: (e: Error) => T = (e: Error) => { throw e }): T {
    try {
        return f()
    } catch (e) {
        console.log("Error", e)
        return recoverWith(e)
    }
}