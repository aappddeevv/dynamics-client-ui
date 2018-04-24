/** 
 * Obtain activities from the from (left) side of a connection using the entity
 * from the to: (right) side of a connection.
 */
import {
    put, call, select,
    CallEffect, PutEffect, SelectEffect,
} from "redux-saga/effects"
import { DAO, defaultActivityAttributes } from "./DAO"
import { FetchContext } from "./interfaces"
import { ResultOps, mkStatus } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { Action } from "redux"

export const name = "connectionsDataSource"

export function dataSource(dao: DAO) {
    return function* (ctx: FetchContext) {
        yield put(ctx.status(mkStatus(true, name)))
        const state = yield select()
        const entityId = state.view.entityId
        try {
            const items = yield call(dao.getEntityFromNavUsingConnectionsTo,
                                     entityId, "activitypointer",
                                     { entitySelects: defaultActivityAttributes})
            yield put.resolve(
                ctx.result(
                    name,
                    ResultOps.okNow(items.map(i => {
                        i.dataSource = name
                        return i
                    }))))
        } catch (e) {
            yield put.resolve(
                ctx.result(
                    name,
                    ResultOps.errorNow(e, "Unable to retrieve activities from connections.")))
        }
        yield put(ctx.status(mkStatus(false, name)))
    }
}

export interface FactoryProps {
    dao: DAO
}

export function Factory(props: FactoryProps) {
    return Promise.resolve({connections: dataSource(props.dao)})
}
