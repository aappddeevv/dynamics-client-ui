/**
 * Redux main view state. Usable for different types of views. Application
 * specific views should create their own state slice.
 */
import { Action, ActionCreator } from "redux"
import { Actions as VA } from "./view"
import { cleanId } from "@aappddeevv/dynamics-client-ui/lib/Data/Utils"
import { selectEntities, selectData, Actions as DA } from "./data"
import { createSelector } from "reselect"
import R = require("ramda")
import { createActivityArgsBuilder } from "../createNewActivityUtils"
import { put, select, PutEffect, SelectEffect } from "redux-saga/effects"
import { ActionCreatorsMap } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/actionutils"
import { XRM } from "@aappddeevv/dynamics-client-ui"
import { ActivityItem } from "../datasources/datamodel"
import { DataAction } from "./data"

export const STATE_KEY = "view"

export interface ViewState {
    xrm: XRM | null
    entityId: string | null
    entityName: string | null
    /** Dynamics form attribute name that holds " name" for this entity. */
    entityAttributeNameForName: string | null
    entitySet: string | null
    entityTypeCode: number | null
    userId: string | null
    /** Selected ActivityItems */
    selectedIds: Array<string>
    message: string | null
    search: string | null
    isLoading: boolean
    useQuickCreateForm: boolean
    /** Are we using the UCI interface? */
    isUci: () => boolean
}

export const initialstate: ViewState = {
    xrm: null, // CRM object, needed for some state processing
    entityId: null, // contact, account, etc.
    entityName: null, // the singular entity type  name e.g. contact or account
    entityAttributeNameForName: null, // the attribute name that holds a "name" for this entity
    entitySet: null, // the entity set name, the plural name e.g. contacts or accounts. NOT ADDED!
    entityTypeCode: null, /// entity numeric type code e.g. contact=2
    userId: null,
    selectedIds: [], // Array[string] of object ids, use ids to preserve selection across filters/etc.
    message: null, // overall message for the view
    search: null, // string, could be incremental (as you type) or full search (e.g. return hit)
    isLoading: false, // true if loading and perhaps should show progress indicator
    useQuickCreateForm: true, // true if quick create form should be used for new entities, false for standard new form. Overrides below.
    isUci: () => false, // help with API dependencies internally
}

export enum TypeKeys {
    SET_MESSAGE = "view.SET_MESSAGE",
    SET_IDS = "view.SET_IDS",
    SELECT_IDS = "view.SELECT_IDS",
    SELECT_FIRST = "view.SELECT_FIRST",
    RESET_SELECTION = "view.RESET_SELECTION",
    OPEN_FORM = "view.OPEN_FORM",
    SET_XRM = "view.SET_XRM",
    SET_LOADING = "view.SET_LOADING",
    SET_CLIENT_INFO = "view.SET_CLIENT_INFO",
}

export interface ViewAction extends Action {
    type: TypeKeys
}

export const selectFirstEntity = () => ({ type: TypeKeys.SELECT_FIRST })
export const resetSelection = () => ({ type: TypeKeys.RESET_SELECTION })
export const setMessage = message => ({ type: TypeKeys.SET_MESSAGE, message })

/** Set ids and entity information for the entity this view is working with. */
export const setIds = (entityId?: string | null, userId?: string | null,
    entityName?: string | null, entityTypeCode?: number | null, entitySet?: string | null) =>
    ({ type: TypeKeys.SET_IDS, entityId, userId, entityName, entityTypeCode, entitySet })

/** Misc info about the client environment that's relevant to internal ops and not easily derivable. */
export const setClientInfo = (props) => ({ type: TypeKeys.SET_CLIENT_INFO, ...props })

export const setLoading = (isLoading: boolean) => ({ type: TypeKeys.SET_LOADING, isLoading })
export const selectIds = (ids: Array<string>) => ({ type: TypeKeys.SELECT_IDS, ids })
export const setXrm = (xrm: XRM) => ({ type: TypeKeys.SET_XRM, xrm })

export interface InitProps {
    entityId?: string | null
    userId?: string | null
    entityName?: string | null
    entitySet?: string | null
    entityTypeCode?: number | null
    xrm?: XRM | null
    // not important...
    [pname: string]: any
}

/** Init key attributes such as ids, xrm, and request initial data set. */
export function* init(props: InitProps) {
    yield put(VA.setIds(props.entityId, props.userId,
        props.entityName, props.entityTypeCode, props.entitySet))
    yield put.resolve(VA.setXrm(props.xrm))
    const state = yield select()
    if (!state.view.entityId) {
        yield put(VA.setMessage("No entity id available to obtain activities for."))
    }
    else yield put(DA.requestEntities())
}

/** Open a form with the given parameters. props: CreateActivityFormArgs */
export const openForm = (props) => ({ type: TypeKeys.OPEN_FORM, ...props })

export const Actions: ActionCreatorsMap<ViewAction> = {
    selectFirstEntity,
    resetSelection,
    setMessage,
    setIds,
    setClientInfo,
    setLoading,
    selectIds,
    setXrm,
    openForm,
}

//
// Selectors
//


/** Return the selected activities from the overall state. */
export const selectedIds = (state) => selectView(state).selectedIds

/** Return the currently selected entities. */
export const selectedEntities = createSelector(
    [selectedIds, selectEntities],
    (ids, entities) =>
        entities.filter(e => ids.includes(e.id))
)

/** 
 * Derive selectted indices from the seleted entity ids and the current data array.
 * Note that if you sort the data differently, these indices are fairly useless.
 */
export const selectedIndices = createSelector(
    [selectedIds, selectEntities],
    (ids, entities) =>
        entities.
            map((e, idx) => ({ selected: ids.includes(e.id), index: idx })).
            filter(i => i.selected).
            map(i => i.index)
)

export const selectView = (state): ViewState => state[STATE_KEY];

export default function reducer(state: ViewState = initialstate, action, { _root_ }) {

    switch (action.type) {

        case TypeKeys.SET_CLIENT_INFO: {
            const { isUci } = action
            return { ...state, isUci }
        }

        case TypeKeys.SELECT_FIRST: {
            const entities = selectEntities(_root_)
            if (entities && entities.length > 0 && entities[0].id) {
                const ids = [entities[0].id]
                return { ...state, ids }
            } else return state
        }

        case TypeKeys.SELECT_IDS: {
            let ids = R.isNil(action.ids) ? [] : action.ids
            if (!Array.isArray(ids)) ids = [ids]
            return { ...state, selectedIds: ids }
        }

        case TypeKeys.SET_IDS: {
            return {
                ...state,
                entityId: action.entityId ? cleanId(action.entityId) : null,
                userId: action.userId ? cleanId(action.userId) : null,
                entityName: action.entityName,
                entityTypeCode: action.entityTypeCode,
                entitySet: action.entitySet ? action.entitySet : null,
            }
        }

        case TypeKeys.RESET_SELECTION: {
            return { ...state, selectedIds: [] }
        }

        case TypeKeys.SET_MESSAGE: {
            return { ...state, message: action.message }
        }

        case TypeKeys.SET_XRM: {
            return { ...state, xrm: action.xrm }
        }

        case TypeKeys.SET_LOADING: {
            const { isLoading } = action
            return { ...state, isLoading }
        }

        default:
            return state
    }
}
