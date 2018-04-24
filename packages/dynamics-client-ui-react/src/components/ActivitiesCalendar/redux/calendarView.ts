/** Calendar view specific view content. */
import { Action, ActionCreator } from "redux"
import {
    Actions as VActions, DataAction, ViewAction
} from "../../ActivitiesReader/redux"
import { createMultiSelect, mkChange, ThunkAction } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/actionutils"
import * as moment from "moment"
const update = require("immutability-helper")
import { XRM } from "@aappddeevv/dynamics-client-ui"
import { put, PutEffect } from "redux-saga/effects"

export const STATE_KEY = "calendarView"

export interface State {
    start: moment.Moment | null
    end: moment.Moment | null
    date: moment.Moment
    view: string
}

export const initialState = {
    start: null, // moment format, start of data fetch range
    end: null, // moment format, end of data fetch range
    date: moment(), // moment format, default is today
    view: "week", // big-calendar view name, default is "month"
}

export enum TypeKeys {
    SET_DATES = "calendar.SET_DATES",
    SET_VIEW = "calendar.SET_VIEW",
    SET_USERS = "calendar.SET_USERS",
    UPDATE_CALENDAR_DATE = "calendar.UPDATE_CALENDAR_DATE",
    REQUEST_USERS = "calendar.REQUEST_USERS",
}
export interface ViewAction extends Action {
    type: TypeKeys
}

/** Initialize key attributes, ids, xrm and request initial data. */
export function* init({ userId, xrm }: { userId?: string, xrm?: XRM | null }) {
    yield put(VActions.View.setIds(null, userId))
    yield put.resolve(VActions.View.setXrm(xrm))
    yield put(VActions.Data.requestEntities())
}

export const selectCalendarView = (state) => state[STATE_KEY]

/** If start, end not specified. Calcuate start, end based on date and view setting. */
export const setDates = (date: moment.Moment, view: string, start?: moment.Moment | null, end?: moment.Moment | null) =>
    ({ type: TypeKeys.SET_DATES, start, end, date, view })

export const requestUsers = (filter = defaultUserFilter) => ({ type: TypeKeys.REQUEST_USERS, filter })

/** Only set the view. */
export const setView = view => ({ type: TypeKeys.SET_VIEW, view })

/** date - javascript date */
export const updateCalendarDate = (date, view) => ({ type: TypeKeys.UPDATE_CALENDAR_DATE, date, view })

export const Actions = {
    setDates,
    requestUsers,
    setView,
    updateCalendarDate,
}

export function reducer(state: State = initialState, action, { _root_ }) {
    switch (action.type) {
        case TypeKeys.SET_DATES: {
            const date = action.date
            const view = action.view
            const start = action.start || date.clone().startOf(view)
            const end = action.end || date.clone().endOf(view)
            return { ...state, start, end, date, view }
        }
        case TypeKeys.SET_VIEW: {
            let { view } = action
            if (!view) view = "month"
            if (view !== state.view) {
                return { ...state, view }
            } else
                return state
        }

        default:
            return state
    }
}

export default reducer

/**
 * A filter that returns true if the name of the user
 * is a Dynamics system account or account that
 * we do not want to expose e.g. Support.
 */
export const defaultUserFilter = (u) => {
    if (u.lastname === "INTEGRATION" ||
        u.firstname === "Support" ||
        u.firstname === "Delegated Admin" ||
        u.lastname === "SYSTEM")
        return false
    return true
}
