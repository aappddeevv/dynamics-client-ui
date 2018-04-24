import { defaultActivityAttributes } from "./DAO"
import {
    call, select, put,
    CallEffect, PutEffect, SelectEffect,
} from "redux-saga/effects"
import { DAO } from "./DAO"
import { FetchContext } from "./interfaces"
import { ResultOps, mkStatus } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { Action } from "redux"

export const name = "activitypartiesDataSource"

/**
 * Use activityparty and a specific participation value (or all of them) to
 * obtain activityparties. This uses the nav property activityid_activitypointer
 * to obtain the list or you can obtain specific activity types by changing
 * the nav property.
 */
export function dataSource(dao: DAO,
                           navProperty = "activityid_activitypointer") {
    return function* (ctx: FetchContext) {
        yield put(ctx.status(mkStatus(true, name)))
        const state = yield select()
        const filter = null
        const entityId = state.view.entityId
        if (!entityId) yield put(ctx.result(name, ResultOps.okNow([])))
        else {
            try {
                const items = yield call(dao.getActivityPartyActivitiesFor, entityId, {
                    dropIfPartyDeleted: true,
                    FormattedValues: true,
                    nav: navProperty,
                    navSelects: defaultActivityAttributes
                })
                yield put.resolve(
                    ctx.result(name, ResultOps.okNow(items.map(i => {
                        i.dataSource = name
                        return i
                    }))))
            } catch (e) {
                yield put.resolve(
                    ctx.result(name,
                        ResultOps.errorNow(
                            e, "Unable to retrieve activities from activity parties.")))
            }
        }
        yield put(ctx.status(mkStatus(false, name)))
    }
}

export interface FactoryProps {
    dao: DAO
    navProperty?: string
}

export function Factory(props: FactoryProps) {
    return Promise.resolve({ activityParty: dataSource(props.dao, props.navProperty) })
}
