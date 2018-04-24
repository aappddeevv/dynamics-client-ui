/** Redux data processing state. */
import { AnyAction, ActionCreator, Action } from "redux"
const R = require("ramda")
import { createSelector } from "reselect"
import { put } from "redux-saga/effects"
import { Status, Result } from "@aappddeevv/dynamics-client-ui/lib/Data"
const update = require("immutability-helper")

// break up imports to avoid cycle dependency
import {
    newlinesToHtml, prepActivity, prepAnnotation, ActivityItem,
} from "../datasources/datamodel"
import {
    DAO,
} from "../datasources/DAO"

import {
    EnhancerFactory, FactoryContext, Processor, NamedProcessor,
    Enhancer, FetchContext, DataSource, ErrorInfo, Content,
} from "../datasources/interfaces"
import { Either } from "monet"

export { ErrorInfo, Content, Either }


export const STATE_KEY = "data"

export interface DataState {
    /** array of data sources */
    dataSources: Array<DataSource>

    /** array of {name,func} objects. Need name so we can remove, add individually. */
    processors: Array<NamedProcessor<ActivityItem>>

    /** Processors that are always applied e.g. dedup. We don't need names for these. */
    alwaysProcessors: Array<Processor>

    /** Enhancers to apply to the data. Order is not guaranteed so they need to be robust. */
    enhancers: Array<Enhancer>

    /** Combined set of activities/annotations to show in the UI, uses the "target" ActivityItem data model. */
    activities: Array<ActivityItem>

    /** Error associated with processing. */
    activitesError: Error

    /** Whether we are fetching activities from any source. */
    activitiesIsFetching: boolean

    /** Fetch request status, by data source name, fetching/finished/not present */
    fetchStatus: { [dataSourceName: string]: Status }

    /** Fetch results. Don't let fetchStatus get out of sync with fetchResults :-). */
    fetchResult: { [dataSourceName: string]: Result<ActivityItem> }

    /** Items collected and enhanced from each dataSource. They should be ActivityItem format. */
    buffer: Array<ActivityItem>

    /** true => dataSource entities is cloned before going through  */
    cloneBeforeEnhancement: boolean
}

const initialState = {
    dataSources: [],
    processors: [],
    alwaysProcessors: [],
    enhancers: [],
    activities: [],
    activitesError: null,
    activitiesIsFetching: false,
    fetchStatus: {},
    fetchResult: {},
    buffer: [],
    cloneBeforeEnhancement: true,
}

// todo, convert to camel names
export enum TypeKeys {
    RESET_DATA = "activities.data.__RESET_DATA",
    SET_DATASOURCES = "activities.data.__DATASOURCES",
    SET_ENHANCERS = "activities.data.__SET_ALL_ENHANCERS",
    SET_BUFFER = "activities.data.__SET_BUFFER",
    ADD_PROCESSORS = "activities.data.__ADD_PROCESSORS",
    REMOVE_PROCESSORS = "activities.data.__REMOVE_PROCESSORS",
    SetAlwaysProcessors = "activities.data.setAlwaysProcessors",
    AddAlwaysProcessors = "activities.data.addAlwaysProcessors",
    REQUEST_ENTITIES = "activities.data.__REQUEST_ENTITIES",
    FETCH_ENTITIES = "activities.data.__FETCH_ENTITIES",
    RECEIVE_ENTITIES = "activities.data.__RECEIVE_ENTITIES",
    REQUEST_ENTITIES_FAILED = "activities.data.__REQUEST_ACTIVITIES_FAILED",
    PROCESS_DATASOURCE_BUFFERS = "activities.data.__PROCESS_BUFFER", // consolidate dataSources, run enhancers
    /** Apply the processors in state to the buffer. It does not aggregate from fetch results to the buffer. */
    ApplyProcessors = "activities.data.__APPLY_PROCESSORS", // apply processors
    SET_ENTITIES = "activities.data.__ADD_ENTITIES", // set entities to use in component

    UPDATE_STATUS = "activities.data.updateStatus",
    ADD_RESULT = "activities.data.addResult",
}

export interface DataAction extends AnyAction {
    type: TypeKeys
}

// ARGH! NEED TO ADD THE REST OF THESE

export interface UpdateStatusAction extends DataAction {
    type: TypeKeys.UPDATE_STATUS
}

export interface RequestEntitiesAction extends DataAction {
    type: TypeKeys.REQUEST_ENTITIES
}

export interface ResetDataAction extends DataAction {
    type: TypeKeys.RESET_DATA
}

export type ActionType =
    UpdateStatusAction |
    RequestEntitiesAction |
    ResetDataAction

//
// Action creators, all of these sholud be covered under ActionType.
//

export const updateStatus = (status: Status) =>
    ({ type: TypeKeys.UPDATE_STATUS, status })

export const addResult = <T= any>(name: string, result: Result<T>) =>
    ({ type: TypeKeys.ADD_RESULT, name, result })

/** Reset data buffers if you want to remove all processed data. */
export const resetData = () => ({ type: TypeKeys.RESET_DATA })

/** Start the request process from the data sources. */
export const requestEntities = () => ({ type: TypeKeys.REQUEST_ENTITIES })

/** Set the data sources. */
export const setDataSources = (dataSources: Array<DataSource>) =>
    ({ type: TypeKeys.SET_DATASOURCES, dataSources })

/** Set an ordered set of enhancers to use. */
export const setEnhancers = (es: Array<Enhancer>) => ({
    type: TypeKeys.SET_ENHANCERS,
    enhancers: es,
})

/** Apply processors to reduce "buffer" to "entities". */
export const applyProcessors = () => ({ type: TypeKeys.ApplyProcessors })

/**
 * Set entities to the component's source of "official" entities. These should
 * be set *after* the data pipeline processing.
 */
export const setEntities = (entities) => ({
    type: TypeKeys.SET_ENTITIES,
    entities,
})

/** Set the buffer. The buffer is processed into "activities." */
export const setBuffer = (buffer) => ({
    type: TypeKeys.SET_BUFFER,
    buffer,
})

/** Process data sources buffers request. */
export const processDataSourceBuffers = () =>
    ({ type: TypeKeys.PROCESS_DATASOURCE_BUFFERS })

/**
 * Set processors that process the buffer to create the displayed data. Adding processors
 * that already exist (by name) overwrites the existing processors.
 * @param processors {name,processor} pairs.
 * @param reapply Reapply processors to buffer.
 */
export const addProcessors = (processors: Array<NamedProcessor<ActivityItem>>, reapply: boolean = false) =>
    ({ type: TypeKeys.ADD_PROCESSORS, processors, reapply })

/**
 * Remove processors.
 * @param {Array[string]} removes List of processors to remove.
 * @param {boolean} reapply Reapply processors to buffer.
 */
export const removeProcessors = (removes, reapply: boolean = false) =>
    ({ type: TypeKeys.REMOVE_PROCESSORS, removes, reapply })

export const setAlwaysProcessors = (alwaysProcessors: Array<Processor>) =>
    ({ type: TypeKeys.SetAlwaysProcessors, alwaysProcessors })

export const addAlwaysProcessors = (alwaysProcessors: Array<Processor>) =>
    ({ type: TypeKeys.AddAlwaysProcessors, alwaysProcessors })

/** All actions from this module. Change to ActionType once its done. */
export const Actions: Record<string, ActionCreator<DataAction>> = {
    updateStatus,
    addResult,
    resetData,
    setDataSources,
    requestEntities,
    setEnhancers,
    applyProcessors,
    setEntities,
    setBuffer,
    processDataSourceBuffers,
    addProcessors,
    removeProcessors,
    setAlwaysProcessors,
}

export default function reducer(state = initialState, action, injected) {
    switch (action.type) {

        case TypeKeys.RESET_DATA:
            return {
                ...state,
                activities: [],
                fetchStatus: {},
                buffer: [],
            }

        case TypeKeys.SET_DATASOURCES:
            return { ...state, dataSources: action.dataSources }

        case TypeKeys.SET_ENHANCERS:
            return { ...state, enhancers: action.enhancers }

        case TypeKeys.ADD_PROCESSORS: {
            // Find by name, if exists remove it, then add the new ones
            const addnames = action.processors.map(p => p.name)
            const withadds = state.processors.filter((p: any) => !addnames.includes(p.name)).concat(action.processors)
            const interimStatea = { ...state, processors: withadds }
            if (action.reapply) {
                const processed = reapplyProcessors(interimStatea)
                return { ...interimStatea, activities: processed }
            }
            else
                return interimStatea
        }
        case TypeKeys.REMOVE_PROCESSORS: {
            const withremoves = state.processors.filter((p: any) => !action.removes.includes(p.name))
            const interimStateb = { ...state, processors: withremoves }
            if (action.reapply) {
                const processed = reapplyProcessors(interimStateb)
                return { ...interimStateb, activities: processed }
            } else
                return interimStateb
        }
        case TypeKeys.SetAlwaysProcessors:
            return { ...state, alwaysProcessors: action.alwaysProcessors }

        case TypeKeys.AddAlwaysProcessors:
            return { ...state, alwaysProcessors: action.alwaysProcessors.concat(action.alwaysProcessors) }

        case TypeKeys.SET_BUFFER:
            return { ...state, buffer: action.buffer }

        case TypeKeys.UPDATE_STATUS: {
            const { status } = action
            return update(state, {
                fetchStatus: {
                    $merge: {
                        [status.name]: status,
                    },
                },
            })
        }

        case TypeKeys.ADD_RESULT: {
            const { result, name } = action
            return update(state, {
                fetchResult: {
                    $merge: {
                        [name]: result,
                    },
                },
            })
        }

        case TypeKeys.RECEIVE_ENTITIES:
            const rstatus = {
                name: action.name,
                isFetching: false,
                lastUpdate: action.receivedAt,
                buffer: action.items,
            }

            return {
                ...state,
                activitiesIsFetching: false,
                activitiesError: null,
                fetchStatus: {
                    ...state.fetchStatus,
                    [action.name]: rstatus,
                },
            }

        case TypeKeys.SET_ENTITIES:
            return { ...state, activities: action.items }

        case TypeKeys.ApplyProcessors:
            const processed = reapplyProcessors(state)
            return { ...state, activities: processed }

        default:
            return state
    }
}

/** Given state with buffer, return processed data. */
function reapplyProcessors(state) {
    const recents = state.processors.map(p => p.processor)
    return applyProcessorsTo(state.buffer, state.alwaysProcessors.concat(recents))
}

/**
 * Apply processors to an array of entities. A new array is returned.
 * Processors are items => items.
 * @return {Array[object}} Array of processed data.
 */
export function applyProcessorsTo(data, processors) {
    data = [...data]
    if (processors.length > 0) {
        try {
            data = R.pipe.apply(null, processors)(data)
        } catch (e) {
            console.log("Error applying processors, they were not applied", e)
        }
    }
    return data
}

//
// Selectors (acting on global state?)
//

/** Get the data slice of state assuming default slice name. */
export const selectData = (state): DataState => state[STATE_KEY]

/** Select the data sources. */
export const selectDataSources = (state) => selectData(state).dataSources

export const selectEnhancers = (state) => selectData(state).enhancers

export const selectFetchStatus = (state) => selectData(state).fetchStatus

/** Return the set of final activities (entities). */
export const selectEntities = (state) => selectData(state).activities

/** Return all processers, always first, then the ephemeral ones. */
export const selectProcessors = createSelector(
    [state => selectData(state).alwaysProcessors, state => selectData(state).processors],
    (always, ephemeral) => always.concat(ephemeral.map(p => p.processor)),
)

/** True if inProgress=true for any fetch status is true. Local. */
export const inProgress = createSelector(
    [(data: DataState) => data.fetchStatus],
    statuses => R.any(p => p[1].inProgress === true, R.toPairs(statuses)),
)

/** True if any fetch errors are present on fetchResults. Local. */
export const anyFetchErrors = createSelector(
    [(data: DataState) => data.fetchResult],
    results => R.any(p => p[1].isLeft, R.toPairs(results)),
)

/** Adds or adds to existing enhancedBy array on obj. obj is mutated. */
export function addEnhancedBy(obj: any, id: any) {
    const e = obj.enhancedBy
    if (e && Array.isArray(e)) obj.enhancedBy = e.concat(id)
    else if (e) obj.enhancedBy = [e, id]
    else obj.enhancedBy = [id]
    return obj
}

export const defaultActivityStatusOwnerSelects = [
    "statuscode",
    "statecode",
    "_ownerid_value",
    "activitytypecode",
    "_regardingobjectid_value",
]

/** Must be run after the basic enhancers so that id is available under id. */
export function activityStatusOwnerEnhancer(dao: DAO) {
    return async (ap) => {
        if (ap.id && ap.typecode !== "annotation") {
            const selects = defaultActivityStatusOwnerSelects
            return dao.getActivityPointer(ap.id, selects).
                then(r => {
                    ap.statecodestr = r["statecode@OData.Community.Display.V1.FormattedValue"]
                    ap.statuscodestr = r["statuscode@OData.Community.Display.V1.FormattedValue"]
                    ap.owner = r["_ownerid_value@OData.Community.Display.V1.FormattedValue"]
                    ap.typecodestr = r["activitytypecode@OData.Community.Display.V1.FormattedValue"]
                    ap.regarding = r["_regardingobjectid_value@OData.Community.Display.V1.FormattedValue"]
                    return addEnhancedBy(ap, "activityStatusOwner")
                }).
                catch(e => {
                    console.log("did not find specific analysis activity", ap.activity, e)
                    return ap
                })
        }
        return Promise.resolve(ap)
    }
}

/**
 * Convert an activitypointer to the item model. Adds the
 * original record to the property "originalRecord". Updates
 * the notes from plain text to HTML by changing newlines => <br>.
 */
export async function activityPointerToItemModel(ap) {
    if (ap.activityid) {
        const rval = addEnhancedBy(prepActivity(ap), "activityPointertoItemModel")
        rval.description = newlinesToHtml(ap.description)
        rval.originalRecord = ap
        return rval
    }
    return ap
}

/**
 * Convert an annotation to the item model. Adds the
 * original record the property "originalRecord".
 */
export async function annotationToItemModel(ann) {
    if (ann.annotationid) {
        const rval = addEnhancedBy(prepAnnotation(ann), "annotationToItemModel")
        if (ann.description) rval.description = newlinesToHtml(ann.decription)
        rval.originalRecord = ann
        return rval
    }
    return ann
}

/**
 * Default enhancers for activitypointer and annotation json model
 * from the web api.
 */
export const enhancers: EnhancerFactory = (ctx: FactoryContext) => Promise.resolve({
    annotationToItemModel,
    activityPointerToItemModel,
    activityStatusOwnerEnhancer: activityStatusOwnerEnhancer(ctx.dao),
})
