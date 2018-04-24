/**
 * Activity list processing, mostly filters of some sort.
 */
const moment = require("moment")
import { selectFilter } from "./filter"
import R = require("ramda")
import { ActivityItem } from "../datasources"
import { DEBUG } from "BuildSettings"

/** Allow all items. identity function. */
export function allowAll() {
    return items => items
}

/** Allow no items. */
export function allowNone() {
    return items => []
}

/** Sort on an attribute. */
export function sortby(attr: string, dir: string = "descend") {
    let sorter = null
    // @ts-ignore
    if (dir.toLowerCase() === "descend") sorter = R.descend([R.prop(attr)])
    // @ts-ignore
    else if (dir.toLowerCase() === "ascend") sorter = R.ascend([R.prop(attr)])
    // @ts-ignore
    else sorter = R.ascend([R.prop(attr)])

    // @ts-ignore
    return items => R.sortWith(sorter)
}

/** Dedup a list based on a keyAttr default is "id" */
export function dedupe(keyAttr = "id") {
    return items => R.uniqBy(R.prop(keyAttr), items)
}

/**
 * Filter a list by date. Only earliest and later are allowed.
 * @param {Date} earliest Earliest date allowed.
 * @param {string} attribute Attribute on item to check. Must be a Date object.
 * @sig Date => Array => Array
 */
export function filterByDateGE(earliest, attribute) {
    return (items: Array<ActivityItem>) => {
        return items.filter(item => {
            const value = item[attribute]
            if (DEBUG) console.log("filterByDateGE", earliest, attribute, value)
            if (R.isNil(value)) return true
            else if (!R.isNil(value) && value >= earliest) return true
            else return false
        })
    }
}

export function createDateProcessor(state) {
    const filter = selectFilter(state)
    let dateToStart = null
    switch (filter.range) {
        case 1:
            dateToStart = moment().subtract(12, "month").startOf("month").toDate();
            break;
        case 2:
            dateToStart = moment().subtract(6, "month").startOf("month").toDate();
            break;
        case 3:
            dateToStart = moment().subtract(90, "day").startOf("day").toDate();
            break;
        case 4:
            dateToStart = moment().subtract(30, "day").startOf("day").toDate();
            break;
        case 5:
            dateToStart = moment().subtract(7, "day").startOf("day").toDate();
            break;
        case 6:
            dateToStart = moment().subtract(1, "day").startOf("day").toDate();
            break;
        case 7:
            dateToStart = moment().startOf("day").startOf("day").toDate();
            break;
    }
    return dateToStart ? filterByDateGE(dateToStart, filter.attribute) : allowAll()
}

export const defaultOpenCodes = [0]

export const defaultClosedCodes = [1, 2, 3]

/**
 * Filter on statuscode of activity or annotation. State codes
 * are integers so watch out for comparisons.
 */
export function filterOnActivityStateCodes(allowed: Array<number> = []) {
    return (items: Array<ActivityItem>) =>
        items.filter(item => {
            const value = item.statecode
            if (R.isNil(value)) return true
            else if (!R.isNil(value) && allowed.includes(value)) return true
            else return false
        })
}

/** Grab state.filter.state (activity state) and create a processor. */
export function createStateProcessor(state) {
    const filter = selectFilter(state)
    const allowed = filter.state
    return filterOnActivityStateCodes(allowed)
}

/**
 * Filter on activitypecode, known as typecode in the data model, if present.
 */
export function filterOnActivityTypes(allowed: Array<string> = []) {
    return (items: Array<ActivityItem>) =>
        items.filter(item => {
            const value = item.typecode // item.activitytypecode
            if (!value) return true
            else if (value && allowed.includes(value)) return true
            else return false
        })
}

export function createActivityTypesProcessor(state) {
    const filter = selectFilter(state)
    return filterOnActivityTypes(filter.selectedTypes)
}

/**
 * Filter on _ownerid_value.
 * @param {string} ownerId Owner id.
 * @sig string => Array => Array
 */
export function filterOnOwnerId(ownerId) {
    return (items: Array<ActivityItem>) =>
        items.filter(item => {
            const value = item.ownerid || item.originalRecord._ownerid_value ||
                (item as any)._ownerid_value
            if (!value) return true
            else if (value && value.toLowerCase() === ownerId.toLowerCase()) return true
            return false
        })
}

export function createOwnerOnlyProcessor(state) {
    const filter = selectFilter(state)
    return filterOnOwnerId(state.view.userId)
}

/**
 * Filter on ownerid or _ownerid_value. Permissive by default.
 * @param {Array[string]} Owner id array.
 * @sig Array[string] => Array => Array
 */
export function filterOnOwnerIds(owners: Array<string> = []) {
    return (items: Array<ActivityItem>) =>
        items.filter(item => {
            const value = item.ownerid || item.originalRecord._ownerid_value ||
                (item as any)._ownerid_value
            if (!value) return true
            else if (value && owners.includes(value)) return true
            return false
        })
}

export function createOwnersProcessor(state) {
    const filter = selectFilter(state)

    // const keepIt = item =>
    //       filter.ownerFilters.
    //       map(predicate => predicate(item)). // no early termination, fix me
    //       find(b => b === true)

    // const more = (filter.ownerFilters.length>0) ?
    //       (items => items.filter(keepIt)) :
    //       R.identity

    // return R.pipe(
    //     more,
    //     filterOnOwnerIds(filter.owners))
    return filterOnOwnerIds(filter.owners)
}
