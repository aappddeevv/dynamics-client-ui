/**
 * Aannotations (notes) from an entity.
 */
import {
    put, call, select,
    CallEffect, PutEffect, SelectEffect,
} from "redux-saga/effects"
import { FetchContext } from "./interfaces"
import { DAO } from "./DAO"
import { ResultOps, mkStatus } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { Action } from "redux"

export const name = "annotationsDataSource"

export function dataSource(dao: DAO) {
    return function* (ctx: FetchContext) {
        yield put(ctx.status(mkStatus(true, name)))
        const state = yield select()
        const entityId = state.view.entityId
        if (!entityId) yield put(ctx.result(name, ResultOps.okNow([])))
        else {
            try {
                const items = yield call(dao.getAnnotationsFor, entityId)
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
                        ResultOps.errorNow(e, "Unable to retrieve annotations.")))
            }
        }
        yield put(ctx.status(mkStatus(false, name)))
    }
}

export interface FactoryProps {
    dao: DAO
}

export function Factory(props: FactoryProps) {
    return Promise.resolve({ annotations: dataSource(props.dao) })
}
