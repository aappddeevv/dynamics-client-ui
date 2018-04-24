/**
 * Enormously useful when managing state when its a list and 
 * you need easy changes from callbacks. 
 */

import { findIndex } from "ramda"

/** Type of change. */
export type ChangeType = "add" | "remove" | "change"


/** Return a mutated map. */
export function changeMap<T>(m: {[pname: string]: T},
                             changeType: ChangeType,
                             item: T,
                             getId: (t:T) => any): typeof m
{
    switch(changeType) {
        case "add":
            m[getId(item)] = item
        case "remove":
            delete m[getId(item)]
        case "change":
            m[getId(item)] = item
    }
    return m
}




/** 
 * Add, remove or change list entries. If change indicated and
 * the element is not found, it is added to the end. Uses 
 * strict equals by default.
 */
export function changeListBase<T>(input: Array<T>,
                                  changeType: ChangeType,
                                  change: T,
                                  getId: (t:T) => any,
                                  equals: (t:T, t2:T) => boolean = (t:T, t2:T) => t === t2)
{
    let result: Array<T> = []
    const id = getId(change)
    switch(changeType) {
        case "add":
            result = [...input, change]
            break
        case "remove":
            result = input.filter(t => !equals(getId(t), id))
            break
        case "change":
            result = [...input]
            const idx = findIndex(t => equals(getId(t), id), result)
            // if found, change it, otherwise add it
            if(idx > -1) result[idx] = change
            else result.push(change)
            break
    }
    return result
}

/** Change a last assuming it has an "id" property. */
export function changeList<T extends {id: string}>(input: Array<T>,
                                                   changeType: ChangeType,
                                                   change: T) {
    return changeListBase(input, changeType, change, t => t.id)
}

