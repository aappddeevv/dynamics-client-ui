/** Functions to combine reducers but provide a 3rd arguent, the overall state. */

import { Reducer, AnyAction } from "redux"

 
/** A reducer that takes injected values as a third argument. */
export type Reducer3<LS> = (ls: LS, a: AnyAction, inj: Record<string, any>) => LS

/** 
 * A combineReducers replacement that adds additional arguments
 * to the reduction call to inject different values a reducer
 * might need, read-only, from other parts of the tree. Reducer
 * order calling is not specified. The overall state is included under 
 * the key "_root_". The
 * injectables can be thought of as "selectors" that take the global state. 
 * You need this type of combiner like this when you have a large set of state
 * split up into smaller slices but the smaller slices have
 * dependencies on other parts of the state, hopefully, small dependences :-)
 *
 * @template S Combined state object type.
 * @param reducers Reducer object. Each key with a function is included in a final reducer.
 *   These reducers must take three arguments (local state, action, global state).
 * @param injectables Key-Functions/values. All functions are called with the overall state
 *    and current action. The results are attached to an object under their original keys.
 *    Non-function values are attached directly.
 *    Ensure that the keys from each injectable do not collide.
 * @param rootName The name of the root state added to the third argument automatically.
 */

export function combineReducers<S>(reducers: Record<string, Reducer3<any>>,
                                   injectables: Record<string, Reducer<S>|any> = {},
                                   rootName: string ="_root_"): Reducer<S & Record<string, any>>
{
    const finalReducers = {}
    for(var prop in reducers) {
        const reducer = reducers[prop]
        if(typeof reducer === "function") {
            finalReducers[prop] = reducer
        }
    }

    return function composed(state: S, action: AnyAction): S & Record<string, any> {
        const finalState = {}
        let hasChanged = false
        for(var prop in finalReducers) {
            const reducer =  finalReducers[prop]
            const previousState = state ? state[prop] : undefined
            const nextState = reducer(previousState, action, process(injectables, state, action, rootName))
            if(typeof nextState === "undefined") {
                throw new Error(`Reducer for key ${prop} returned undefined.`)
            }
            finalState[prop] = nextState
            hasChanged = hasChanged || nextState !== previousState
        }
        return hasChanged ? finalState as (S & Record<string,any>) : state
    }

}

/** Create the injected values using S and the injectable functions. 
 * Add the global state under rootName. 
 */
function process<S>(injectables: Record<string, Reducer<S>>,
                    state: S, action: AnyAction, rootName: string): Record<string, any>
{
    const rval = { [rootName]: state }
    for(var prop in injectables) {
        const func = injectables[prop]
        if(typeof func === "function")
            rval[prop] = func(state, action)
        else
            rval[prop] = func
    }
    return rval
}

