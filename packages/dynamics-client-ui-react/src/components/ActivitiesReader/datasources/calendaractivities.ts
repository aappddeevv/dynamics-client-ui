/**
 * Obtain activities from the from (left) side of a connection using the entity from
 * the to: (right) side of a connection.
 */
import {
    put, call, select,
    CallEffect, PutEffect, SelectEffect,
} from "redux-saga/effects"
import { DAO } from "./DAO"
import { FetchContext } from "./interfaces"
import { ResultOps, mkStatus } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { Action } from "redux"

export const name = "calendarDataSource"

// should concat to DAO.defaultActivityAttributes
const defaultSelects = [
    "activityid",
    "subject",
    "description",
    "createdon",
    "createdby",
    "modifiedon",
    "modifiedby",


    "statecode",
    "statuscode",
    "activitytypecode",

    "scheduledstart",
    "scheduledend",
    "scheduleddurationminutes",

    "actualstart",
    "actualend",
    "actualdurationminutes",
    
    "_ownerid_value",
    "_regardingobjectid_value"
]

/**
 * +-6 days is always added to month fetches since those can be displayed
 * in a calendar view. Requires the calendarView state slice.
 */
export function dataSource(dao: DAO, selects?: Array<string>) {
    const s: Array<string> = selects || defaultSelects
    return function* (ctx: FetchContext) {
        yield put(ctx.status(mkStatus(true, name)))
        const state = yield select()
        const view = state.calendarView.view
        const incr = (view === "month") ? 6 : 0
        const startpt = state.calendarView.start.subtract(incr, "d").toDate()
        const endpt = state.calendarView.end.add(incr, "d").toDate()
        const userid = state.view.userid
        try {
            const items = yield call(() =>
                dao.getActivitiesWithStart(startpt, endpt, { selects: s }))
            yield put.resolve(
                ctx.result(name,
                    ResultOps.okNow(items.map(i => {
                        i.dataSource = name
                        return i
                    }))))
        } catch (e) {
            yield put.resolve(
                ctx.result(
                    name,
                    ResultOps.errorNow(
                        e, `Unable to retrieve activities: ${name}: ${e.error.message}`)))
        }
        yield put(ctx.status(mkStatus(false, name)))
    }
}

export interface FactoryProps {
    dao: DAO
    selects?: Array<string>
}

export function Factory(props: FactoryProps) {
    return Promise.resolve({ calendar: dataSource(props.dao, props.selects) })
}
