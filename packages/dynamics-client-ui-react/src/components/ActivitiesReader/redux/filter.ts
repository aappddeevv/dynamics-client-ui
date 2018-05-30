/** Redux filter state management. */
import { AnyAction, Action, ActionCreator } from "redux"
import {
    createSingleSelect,
    createMultiSelect, mkWrapper,
    mkSubactionSaga, MultiSelectActionCreator,
    SingleSelectActionCreator,
    MultiActionCreator, ActionCreatorTypes, WrapperActionCreator,
} from "@aappddeevv/dynamics-client-ui/lib/Dynamics/actionutils"
import { createSelector } from "reselect"
import { select, put, call, take, actionChannel, CallEffect } from "redux-saga/effects"
const update = require("immutability-helper")
import { SagaIterator } from "redux-saga"
import {
    createActivityTypesProcessor,
    createStateProcessor,
    createOwnerOnlyProcessor,
    createDateProcessor,
    createOwnersProcessor,
} from "./processors"
import { Actions as DataActions } from "./data"
import * as colors from "@aappddeevv/dynamics-client-ui/lib/Dynamics/colors"
import * as tinycolor from "tinycolor2"
import * as R from "ramda"

export { SingleSelectActionCreator }

export const STATE_KEY = "filter";

/** Some owner filters, here for convenience.. */
export const OwnerFilters = {
    disabled: (owner) => R.isNil(owner.isdisabled) ? true : (owner.isdisabled === true),
    enabled: (owner) => R.isNil(owner.isdisabled) ? true : (owner.isdisabled === false),
    hasId: (id: string, key: string = "id") => (owner: any) => owner[key] === id,
    contains: (attribute: string, m: RegExp) => (owner: any) => m.exec(owner[attribute]),
}

export type Predicate = (i: any) => boolean

export interface FilterState {
    yoursOnly: boolean
    /** All owner objects i.e. systemusers */
    allOwners: Array<any>

    /** Array of owners. Key is id not "value" */
    owners: Array<any>
    /** Array of filter objects. See OwnerFilters. */
    ownerFilters: Array<Predicate>

    types: Array<{ name: string, value: string }>
    /** Array of value (ids) into types. */
    selectedTypes: Array<string>

    states: Array<any>
    state: Array<string>

    attributes: Array<any>
    /** Selected attribute name. */
    attribute: string | null

    ranges: Array<any>
    /** Selected range id. */
    range: string | null

    includes: Array<any>
    /** Selected include. */
    include: Array<string>
}

/**
 * State has "current" selections on filters as well
 * as the reference data i.e. options to choose from.
 * Arrays of options must have a {label,value} pair.
 * Selections store the {label,value} selected pairs.
 */
const initialFilterState: FilterState = {
    yoursOnly: false,
    allOwners: [],
    owners: [],
    ownerFilters: [],
    types: [],
    selectedTypes: [],
    states: [],
    state: [],
    attributes: [],
    attribute: null,
    ranges: [],
    range: null,
    includes: [],
    include: [],
}

export const selectFilter = (state) => state[STATE_KEY]
export const selectedOwners = createSelector(
    [s => selectFilter(s).owners, s => selectFilter(s).allOwners],
    (ownerids, all) => all.filter(o => ownerids.includes(o.id)),
)

/**
 * Many of the keys are auto-generated in createMultiSelect and
 * are not listed here.
 */
export enum TypeKeys {
    SET_OWNER_FILTER = "activities.filter.SET_OWNER_FILTER",
    // One off action names, yoursOnly is a  toggle
    SET_YOURS_ONLY = "SET_YOURS_ONLY",
    YOURS_ONLY_TOGGLE = "YOURS_ONLY_TOGGLE",
}

export interface FilterAction extends Action {
    type: TypeKeys
}

//
// Detailed actions for each filter. These are designed to
// to mutate redux state directly. Each of the variables
// below will have multiple actions create e.g. includes.SET_ALL.ACTION
// will be avaliable as action types and the action will be
// includes.SET_ALL([...]).
//
export const includes = createMultiSelect<FilterAction>("includes")
export const states = createMultiSelect<FilterAction>("states")
export const activityTypes = createMultiSelect<FilterAction>("activityTypes")
export const dateAttrs = createSingleSelect<FilterAction>("dataAttrs")
export const ranges = createSingleSelect<FilterAction>("ranges")
export const setYoursOnly = (yoursOnly) => ({ type: TypeKeys.SET_YOURS_ONLY, yoursOnly });
export const toggleYoursOnly = () => ({ type: TypeKeys.YOURS_ONLY_TOGGLE });
export const owners = createMultiSelect<FilterAction>("owners")
export const setOwnerFilters = (filters: Array<Predicate>) =>
    ({ type: TypeKeys.SET_OWNER_FILTER, filters })

//
// Actions to describe the need to change a filter. A subaction
// describes the specific change.
//
export const changeIncludeFilter = mkWrapper("INCLUDE_FILTER")
export const changeStateFilter = mkWrapper("STATE_FILTER")
export const changeActivityTypesFilter = mkWrapper("ACTIVITYTYPES_FILTER")
export const changeDateFilter = mkWrapper("DATE_FILTER")
export const changeYoursOnlyFilter = mkWrapper("CHANGE_YOURS_ONLY")
export const changeOwnersFilter = mkWrapper("OWNERS_FILTER")

// export const Actions: Record<string, MultiSelectActionCreator<FilterAction> | ActionCreatorTypes<FilterAction>> = {
export const Actions = {
    includes,
    states,
    activityTypes,
    dateAttrs,
    ranges,
    setYoursOnly,
    toggleYoursOnly,
    owners,
    setOwnerFilters,
    changeIncludeFilter,
    changeStateFilter,
    changeActivityTypesFilter,
    changeDateFilter,
    changeYoursOnlyFilter,
    changeOwnersFilter,
}

export default function reducer(state: FilterState = initialFilterState, action) {
    switch (action.type) {
        //
        // includes
        //
        case includes.SET_REFDATA.ACTION:
            return { ...state, includes: action.data }
        case includes.ADD.ACTION:
            if (state.include.find(v => v === action.data))
                return state;
            else
                return update(state, { include: { $push: [action.data] } })
        case includes.REMOVE.ACTION:
            return { ...state, include: state.include.filter(v => v !== action.data) }

        case includes.SET_ALL.ACTION:
            return { ...state, include: state.includes.map((t: any) => t.value) }

        case includes.CLEAR.ACTION:
            return { ...state, include: [] }

        //
        // date and ranges
        //
        case dateAttrs.SET.ACTION:
            return { ...state, attribute: action.data }

        case dateAttrs.SET_REFDATA.ACTION:
            return { ...state, attributes: action.data }

        case ranges.SET.ACTION:
            return { ...state, range: action.data }

        case ranges.SET_REFDATA.ACTION:
            return { ...state, ranges: action.data }

        //
        // states
        //
        case states.SET_REFDATA.ACTION:
            return { ...state, states: action.data }
        case states.ADD.ACTION:
            if (state.state.find(v => v === action.data))
                return state
            else
                return update(state, { state: { $push: [action.data] } })
        case states.REMOVE.ACTION:
            return { ...state, state: state.state.filter(v => v !== action.data) }

        case states.SET_ALL.ACTION:
            return { ...state, state: state.states.map((t: any) => t.value) }

        case states.CLEAR.ACTION:
            return { ...state, state: [] }

        //
        // activity types
        //
        case activityTypes.SET_REFDATA.ACTION:
            return { ...state, types: action.data }

        case activityTypes.ADD.ACTION:
            if (state.selectedTypes.find(v => v === action.data))
                return state
            else
                return update(state, { selectedTypes: { $push: [action.data] } })

        case activityTypes.REMOVE.ACTION:
            return { ...state, selectedTypes: state.selectedTypes.filter(v => v !== action.data) }

        case activityTypes.SET_ALL.ACTION:
            return { ...state, selectedTypes: state.types.map((t: any) => t.value) }

        case activityTypes.CLEAR.ACTION:
            return { ...state, selectedTypes: [] }

        //
        // yours only
        //
        case TypeKeys.SET_YOURS_ONLY:
            return { ...state, yoursOnly: action.yoursOnly }

        case TypeKeys.YOURS_ONLY_TOGGLE:
            return { ...state, yoursOnly: !state.yoursOnly }

        //
        // owners: whenever the list changes within each state change,
        // predicates are used to ensure the change makes sense.
        //
        case owners.SET_REFDATA.ACTION:
            // assign colors and fix ids
            let allOwners = action.data
            // enhance
            allOwners = allOwners.
                map(o => {
                    let color = tinycolor(colors.stringToColour(o.firstname + "-" + o.lastname))
                    if (color.isDark()) color = color.lighten(25).toRgbString()
                    else color = color.toRgbString()
                    let id = o.id
                    if (!id && o.systemuserid) id = o.systemuserid
                    return { ...o, color, id }
                })
            return { ...state, allOwners }

        case owners.ADD.ACTION: {
            if (state.owners.find(v => v === action.data))
                // already in list
                return state
            else {
                // push new item onto list
                return update(state, { owners: { $push: [action.data] } })
            }
        }
        case owners.REMOVE.ACTION: {
            const newOwnerList = state.owners.filter(v => v !== action.data)
            return { ...state, owners: newOwnerList }
        }
        case owners.SET_ALL.ACTION: {
            const newOwnerList = state.allOwners.map((t: any) => t.id)
            return { ...state, owners: newOwnerList }
        }
        case owners.CLEAR.ACTION:
            return { ...state, owners: [] }

        case TypeKeys.SET_OWNER_FILTER: {
            const { filters } = action
            return { ...state, ownerFilters: filters }
        }
        default:
            return state;
    }
}

/**
 * Apply predicates (array of functions) to each item in list.
 * If any predictate returns false, remove the item from the list.
 * Otherwise, keep the item. This *ands* the predicates.
 */
function mustSatisfy(list, predicates) {
    const booleans = list.map(item => {
        return predicates.some(f => f(item))
    })
    booleans.some(value => value === true)
}

//
// None of these are activited, hence, no filtering, until
// a message is sent.
//

export function* adjustActivityTypesFilter() {
    const filterName = changeActivityTypesFilter.ACTION
    yield call(mkSubactionSaga(filterName, function* (action, state) {
        switch (action.subaction.type) {
            case activityTypes.SET_ALL.ACTION: {
                yield put(DataActions.removeProcessors([filterName], true))
                break
            }
            case activityTypes.CLEAR.ACTION: {
                yield put(DataActions.addProcessors([{
                    name: filterName,
                    processor: createActivityTypesProcessor(state),
                    description: "remove all activity types",
                }], true))
                break
            }
            default: {
                // build the processor
                const processor = [{
                    name: filterName,
                    processor: createActivityTypesProcessor(state),
                    description: "misc activity types selects",
                }]
                yield put(DataActions.addProcessors(processor, true))
            }
        }
    }))
}

export function* adjustStateFilter() {
    const filterName = changeStateFilter.ACTION
    yield call(mkSubactionSaga(filterName, function* (action, state) {
        switch (action.subaction.type) {
            case states.SET_ALL.ACTION: {
                // We cheat and just remove the processor so *all* are included
                // without further processing.
                yield put(DataActions.removeProcessors([filterName], true))
                break
            }
            case states.CLEAR.ACTION: {
                yield put(DataActions.addProcessors([{
                    name: filterName,
                    processor: createStateProcessor(state),
                    description: "remove all state codes",
                }], true))
                break
            }
            default: {
                const processor = [{
                    name: filterName,
                    processor: createStateProcessor(state),
                    description: "mixed state codes",
                }]
                yield put(DataActions.addProcessors(processor, true))
            }
        }
    }))
}

export function* adjustOwnerOnlyFilter() {
    const filterName = changeYoursOnlyFilter.ACTION
    yield call(mkSubactionSaga(filterName, function* (action, state) {
        if (state.filter.yoursOnly) {
            yield put(DataActions.addProcessors([{
                name: filterName,
                description: "filter on owner = logged in user.",
                processor: createOwnerOnlyProcessor(state),
            }], true))
        }
        else {
            // remove any existing filter
            yield put(DataActions.removeProcessors([filterName], true))
        }
    }))
}

export function* adjustDateFilter() {
    const filterName = changeDateFilter.ACTION
    yield call(mkSubactionSaga(filterName, function* (action, state) {
        if (action.subaction.type === ranges.SET.ACTION &&
            action.subaction.data === 0) {
            // it's "All" range so just remove the filter
            yield put(DataActions.removeProcessors([filterName], true))
        }
        else {
            yield put(DataActions.addProcessors([{
                name: filterName,
                description: "filter on a date range of some sort",
                processor: createDateProcessor(state),
            }], true))
        }
    }))
}

function mkOwnersProcessor(filterName, state) {
    return [{
        name: filterName,
        processor: createOwnersProcessor(state),
        description: "owners selects",
    }]
}

export function* adjustOwnersFilter() {
    const filterName = changeOwnersFilter.ACTION
    yield call(mkSubactionSaga(filterName, function* (action, state) {
        switch (action.subaction.type) {
            case owners.SET_ALL.ACTION: {
                yield put(DataActions.removeProcessors([filterName], true))
                break
            }
            default:
                yield put(DataActions.addProcessors(mkOwnersProcessor(filterName, state), true))
        }
    }))
}
