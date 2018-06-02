/**
 * Middleware for calendar. It leverages middleware from the ActivitiesViewComponent
 * and exports default configuration information e.g. defaultSources, defaultSagas,
 * defaultEnhancers.
 */
import {
    call, select, take, actionChannel, put,
} from "redux-saga/effects"
import * as E from "redux-saga/effects"
import { SagaIterator } from "redux-saga"
//import { dataSource as caldata } from "../../ActivitiesReader/datasources/calendaractivities"
import { TypeKeys, Actions as LocalVA } from "./calendarView"
import * as selectors from "./selectors"
const moment = require("moment")
import { DEBUG } from "BuildSettings"
import {
    DAO, SagaFactoryContext, EnhancerFactory, FactoryContext,
    combineSagaFactories, combineEnhancerFactories,
} from "../../ActivitiesReader/datasources"
import { activityPointerToItemModel } from "../../ActivitiesReader/redux/data"
import { sagaFactory as stdSagaFactory, Actions as VActions } from "../../ActivitiesReader/redux"

const calendarSagaFactory = (ctx: SagaFactoryContext) => {
    return Promise.resolve([
        updateCalendarDate,
        createRequestUsers(ctx.dao),
    ])
}

/**
 * Saga factories needed to power the view. Includes ActivitiesCalendarView as well as those
 * from ActivitiesView.
 */
export const sagaFactory = combineSagaFactories([stdSagaFactory, calendarSagaFactory])

/**
 * Default enhancers needed, just need one.
 */
export const enhancers: EnhancerFactory = (ctx: FactoryContext) =>
    Promise.resolve({
        activityPointerToItemModel,
    })

function* updateCalendarDate(): SagaIterator {
    if (DEBUG) console.log("Update Calendar Date and Data started.")
    const requestChannel = yield actionChannel(TypeKeys.UPDATE_CALENDAR_DATE)
    while (true) {
        const { date, view } = yield take(requestChannel)
        const { start, end } = yield select(selectors.selectCalendarView)

        const m = moment(date)
        const newstart = m.clone().startOf(view)
        const newend = m.clone().endOf(view)

        const alreadyHaveData = newstart.isSameOrAfter(start) && newend.isSameOrBefore(end)
        if (!alreadyHaveData) {
            yield put.resolve(LocalVA.setDates(m, view, newstart, newend))
            yield put(VActions.Data.requestEntities())
        } else {
            yield put(LocalVA.setDates(m, view, start, end))
        }
    }
}

function createRequestUsers(dao: DAO) {
    return function* (): SagaIterator {
        if (DEBUG) console.log("Request users watcher started.")
        const requestChannel = yield actionChannel(TypeKeys.REQUEST_USERS)
        while (true) {
            const action = yield take(requestChannel)
            let users = []
            try {
                users = yield call(() => dao.getAllUsers())
            }
            catch (e) {
                console.log("Unable to retrieve users", e)
            }
            const filter = action.filter || (() => true)
            users = (users || []).filter(u => filter(u))
            yield put.resolve(VActions.Filter.owners.SET_REFDATA(users))
            yield put(VActions.Filter.owners.SET_ALL())
        }
    }
}
