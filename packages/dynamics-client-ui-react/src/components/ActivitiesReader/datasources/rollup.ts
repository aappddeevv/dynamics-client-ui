import { defaultActivityAttributes, RollupType, DAO } from "./index"
import {
    call, select, put,
    CallEffect, PutEffect, SelectEffect,
} from "redux-saga/effects"
import { FetchContext } from "./interfaces"
import { ResultOps, mkStatus } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { Actions } from "../redux/actions"
import { Action } from "redux"

export const name = "rollupDataSource"

/**
 * Use activityparty and a specific participation value (or all of them) to
 * obtain activityparties. This uses the nav property activityid_activitypointer
 * to obtain the list or you can obtain specific activity types by changing
 * the nav property.
 */
export function dataSource(dao, entitySet, rollupType = RollupType.Related) {
    return function* (ctx: FetchContext) {
        yield put(ctx.status(mkStatus(true, name)))
        const state = yield select()
        const filter = null
        const entityId = state.view.entityId
        if (!entityId) yield put(ctx.result(name, ResultOps.okNow([])))
        else {
            try {
                const items = yield call(() =>
                    dao.getRollupFor(entityId, entitySet,
                        "activitypointer",
                        rollupType,
                        defaultActivityAttributes))
                yield put.resolve(ctx.result(
                    name,
                    ResultOps.okNow(items.map(i => {
                        i.dataSource = name
                        return i
                    }))))
            } catch (e) {
                yield put.resolve(ctx.result(
                    name,
                    ResultOps.errorNow(e, "Unable to retrieve activities from rollup.")))
            }
        }
        yield put(ctx.status(mkStatus(false, name)))
    }
}

/** Required factory props. */
export interface FactoryProps {
    dao: DAO
    entitySet: string
    rollUpType?: RollupType
}

export function Factory(props: FactoryProps) {
    return Promise.resolve({
        rollup: dataSource(props.dao,
            props.entitySet,
            props.rollUpType ? props.rollUpType : RollupType.Related)
    })
}

