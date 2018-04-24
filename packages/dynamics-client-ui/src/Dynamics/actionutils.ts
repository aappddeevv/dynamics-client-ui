/** Redux action management utilities. */
import {
    call, select, put, take, actionChannel,
    PutEffect, SelectEffect, CallEffect, TakeEffect,
    ActionChannelEffect,
} from "redux-saga/effects"
import { Action, AnyAction, ActionCreator } from "redux"
import { ThunkAction as ThunkActionX } from "redux-thunk"

export {
    ActionCreator as ActionCreator,
    Action as Action,
    AnyAction as AnyAction,
}

/** Used for functions that we also add the ACTION name to. */
export type WithACTION = { ACTION: string }

export type ActionCreatorTypes<T extends Action> =
    MultiActionCreator<T> |
    WrapperActionCreator<T> |
    (ActionCreator<T> & WithACTION) |
    ActionCreator<T>

/**
 * A multi-action is an object with well-known keys whose values
 * are action creators. Much the same as redux.ActionCReatorsMapObject.
 */
export interface MultiActionCreator<T extends Action = Action> {
    [name: string]: ActionCreator<T> & WithACTION
}

/** For react-thunk. */
export type ThunkAction = ThunkActionX<any, any, any>
/* export  ThunkAction {
 *     (...args: any[]): (dispatch: any, getState: any) => void
 * }
 * */

/** Redux had ActionCreatorsMapObject already there. */
export type ActionCreatorsMap<A extends Action = Action> =
    Record<string, ActionCreator<A> | WrapperActionCreator<A>>

/** Action wrapper that has an ACTION label and a subaction data property. */
export interface WrapperActionCreator<S extends Action = Action> extends
    ActionCreator<Action & { subaction: S }>, WithACTION {
}

/**
 * Create an action creator. Returns a function that creates an action message
 * with "type" type and argNames as properties on that message corresponding
 * to the arguments of the function call. The actual properties are computed
 * at runtime and hence, we cannot statically make a perfect return type.
 */
export function makeActionCreator<T extends Action = Action>(type: string, ...argNames): ActionCreator<T> {
    return (...args: any[]) => {
        // tslint:disable-next-line:no-object-literal-type-assertion
        const action = { type } as T
        argNames.forEach((arg, index) => {
            action[arg] = args[index] // was action[argNames[index]] = args[index]
        })
        return action
    }
}

/** Default set of prefixes and arg names for createMultiSelect() */
const multiPrefixes = [
    { key: "SET_REFDATA", args: ["data"] }, // set the reference data, all possible values
    { key: "SET", args: ["data"] }, // set all current values exclusively
    { key: "ADD", args: ["data"] }, // add one to the selected list
    { key: "REMOVE", args: ["data"] }, // remove one from the selected list
    { key: "CLEAR", args: [] }, // clear the entire selected list
    { key: "SET_ALL", args: [] }, // set the selected list to the entire list
]

// the above in object form, much easier to work with...
const multiPrefixes2 = {
    SET_REFDATA: ["data"],
    SET: ["data"],
    ADD: ["data"],
    REMOVE: ["data"],
    CLEAR: [],
    SET_ALL: [],
}

/**
 * Return an object with well-known keys that have action creators as values.
 * The returned object has properties from "key" but the
 * actual message type is under the property ACTION on the creator function and is
 * made up of the id and key together.
 *
 * TODO: Convert to object syntax for input, not goofy array.
 */
export function createActionMap<T extends (Action & WithACTION) = (Action & WithACTION)>(
    id: string,
    prefixes: Array<{ key: string, args: Array<string> }>): MultiActionCreator<T> {
    // tslint:disable-next-line:no-object-literal-type-assertion
    const rval = {} as MultiActionCreator<T>
    prefixes.forEach(p => {
        const key = p.key
        const str = id + "." + key
        // first arg must be "type", the rest are more data properties, if present
        const func: ActionCreator<T> & WithACTION =
            makeActionCreator.apply(null, [str].concat(p.args || []))
        func.ACTION = str
        rval[key] = func
    })
    return rval
}

/**
 * An ActionCreator map with properties that match the names of actions needed
 * to manage a multi-select like list of values.
 */
export interface MultiSelectActionCreator<T extends Action = Action> extends MultiActionCreator<T> {
    SET_REFDATA: ActionCreator<T> & WithACTION
    SET: ActionCreator<T> & WithACTION
    ADD: ActionCreator<T> & WithACTION
    REMOVE: ActionCreator<T> & WithACTION
    CLEAR: ActionCreator<T> & WithACTION
    SET_ALL: ActionCreator<T> & WithACTION
}

/**
 * Create string ids and action creators i.e. Record<string, ActionCreator>
 *
 * ```
 * const choices = createMultiSelect("somechoices") // returns an object
 * ```
 * Dispatching:
 * ```
 * dispatch(choices.SET_REFDATA(actionData))
 * ```
 * Reducing:
 * ```
 *  function reducer(state, action) { ...
 *    case choices.SET_ALL.ACTION:
 *      const data = action.data
 *        ...
 * }
 * ```
 */
export function createMultiSelect<T extends Action = Action>(id: string) {
    return createActionMap<T & WithACTION>(id, multiPrefixes) as MultiSelectActionCreator<T & WithACTION>
}

const singlePrefixes = [
    { key: "SET_REFDATA", args: ["data"] },
    { key: "SET", args: ["data"] },
    { key: "CLEAR", args: [] },
]

export interface SingleSelectActionCreator<T extends Action = Action> extends MultiActionCreator<T> {
    SET_REFDATA: ActionCreator<T> & WithACTION
    SET: ActionCreator<T> & WithACTION
    CLEAR: ActionCreator<T> & WithACTION
}

/**
 * Create a single select set of actions.
 * This is just a subset of those in a multi select, SET_REFDATA, SET and CLEAR.
 */
export function createSingleSelect<T extends Action = Action>(id) {
    return createActionMap<T & WithACTION>(id, singlePrefixes) as SingleSelectActionCreator<T & WithACTION>
}

/**
 * Create action and type for changing something. Args will be a subaction.
 * Name on object will be "change.prefix" by default.
 *
 * @deprecated Use mkWrapper
 */
export const mkChange = <T extends Action = Action>(prefix: string, aname: string = "change"): WrapperActionCreator<T> => {
    const actionName = `${aname}.${prefix}`
    const func = makeActionCreator.apply(null, [actionName, "subaction"]) as WrapperActionCreator<T>
    func.ACTION = actionName
    return func
}

/**
 * Create action and type for changing something. Args will be a subaction.
 * Name on object will be "wrapper.prefix".
 */
export const mkWrapper = <T extends Action = Action>(prefix: string) => mkChange<T>(prefix, "wrapper")

/**
 * Make a function from a "filterName" to create a saga
 * action channel on and a handler to call with the most
 * recent state. The subaction is dispatched before calling
 * the handler. You this to track the a message which wraps another
 * message and that needs to be detected in the saga middleware.
 * filterName should be called channelName. You still need to call
 * the returned function.
 *
 * @param {string} filterName Name of channel message type.
 * @param {Function} handler (action,state) => generator
 * @param {boolean} dispatchSubActon Dispatch subaction before calling the handler.
 * @return generator
 */
export function mkSubactionSaga(filterName: string, handler, dispatchSubaction: boolean = true) {
    return function* () {
        const channel = yield actionChannel(filterName)
        while (true) {
            const action = yield take(channel)
            if (dispatchSubaction && action.subaction)
                yield put.resolve(action.subaction)
            const state = yield select()
            if (handler)
                yield call(() => handler(action, state))
        }
    }
}
