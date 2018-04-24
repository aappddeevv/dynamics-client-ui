/**
 * Some utilities to obtain reference data needed for the view.
 */
const R = require("ramda")
import { SagaIterator } from "redux-saga"
import { call, put, all } from "redux-saga/effects"
import { isUci } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import * as Crm from "../crm"
import { Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { DEBUG, API_POSTFIX } from "BuildSettings"
import {
    combineEnhancerFactories, combineDataSourceFactories,
    DAO, SagaFactoryContext, SagaFactory, fetchActivityTypes,
    combineSagaFactories,
} from "./index"
import { Actions as FA } from "../redux/filter"
import { Actions as VA } from "../redux/view"
import { XRM, Client } from "@aappddeevv/dynamics-client-ui"

/** Default activty entity names that are not generally useful to display. */
export const namesReject = [
    "socialactivity",
    "bulkoperation",
    "untrackedemail",
    "incidentresolution",
    "orderclose",
    "quoteclose",
    "letter",
    "opportunityclose",
    "msdyn_bookingalert",
    "msdyn_approval",
    "serviceappointment",
]

/** Default activity entity names to exclude from the new menu. */
const newNamesReject = [
    "campaignactivity",
    "campaignresponse",
    "email",
    "fax",
    "recurringappointmentmaster",
].concat(namesReject)

/** Keep a few standard activities to display by default. */
export function defaultKeepActivity(obj: any, attr: string = "value") {
    if (namesReject.includes(obj[attr])) return false
    return true
}

export function defaultAllowNew(obj: any, attr: string = "value") {
    if (newNamesReject.includes(obj[attr])) return false
    return true
}

export interface Options {
    keepActivity: (a: any) => boolean
    allowNew: (a: any) => boolean
}

export const DefaultOptions = {
    keepActivity: defaultKeepActivity,
    allowNew: defaultAllowNew,
}

/**
 * Initialize the application state with reference data. Options provide
 * a few customizations points sufficient for most applications but you
 * may need to write your own `initReferenceData`. Arrange
 * to run the saga, produced by calling this function, in SagaMiddleware.
 */
export function* initReferenceData(xrm: XRM, client: Client, m: Metadata, options?: Options): SagaIterator {
    const allowNew = (options && options.allowNew) ? options.allowNew : defaultAllowNew
    const keep = (options && options.keepActivity) ? options.keepActivity : defaultKeepActivity

    const ref = yield call(fetchActivityTypes, m)
    const allActivityTypes =
        ref.concat(Crm.annotationsList).
            filter(keep).
            map(entry => ({
                ...entry,
                allowNew: allowNew(entry),
            }))
    const atypes = R.sortBy(R.prop("label"), allActivityTypes) || []
    yield put(FA.activityTypes.SET_REFDATA(atypes))
    yield put(FA.activityTypes.SET_ALL())
    const x = FA.activityTypes.SET_ALL

    // Should we use activityStateOptions? This has 0-4 states vs 0-1
    // with stateOptions.
    yield put(FA.states.SET_REFDATA(Crm.activityStateOptions || []))
    yield put(FA.states.SET_ALL())

    yield put(FA.includes.SET_REFDATA(Crm.includeOptions || []))
    yield put(FA.includes.SET_ALL())
    yield put(FA.dateAttrs.SET_REFDATA(Crm.dateFilterOptions || []))
    const defaultDateV = Crm.dateFilterOptions.find(d => d.default === true)
    yield put(FA.dateAttrs.SET(defaultDateV ? defaultDateV.value : "createdon"))
    yield put(FA.ranges.SET_REFDATA(Crm.dateRangeOptions || []))
    const defaultDateRangeV = Crm.dateRangeOptions.find(r => r.default === true)
    yield put(FA.ranges.SET(defaultDateRangeV ? defaultDateRangeV : 0))
    yield put(FA.setYoursOnly(false))
    yield put(VA.setClientInfo({ isUci: isUci(xrm) }))
}
