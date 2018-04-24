/**
 * Obtain activities from activityparties for a a given entity given that it
 * is mentioned in the regardingobject attribute of the activitypointer. You must pass in
 * the entity naem and nav property on that entity that returns the entities you
 * care about. You can obtain general activitypointers or specialized ones as
 * the nav properties are added to every entity-activity combo. These nav
 * properties should honor roll up activities e.g. Account should get
 * Contact activities through these nav properties if Parental is set
 * on the N:1 relationship on the child--new in Dynamics 2016.
 */
import {
    call, select, put,
    CallEffect, PutEffect, SelectEffect,
} from "redux-saga/effects"
import { DAO } from "./DAO"
import { FetchContext } from "./interfaces"
import { ResultOps, mkStatus } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { DEBUG } from "BuildSettings"
import { Action } from "redux"

export const name = "regardingDataSource"

export function dataSource(dao: DAO, entitySet: string, navProperty: string) {
    return function* (ctx: FetchContext) {
        yield put(ctx.status(mkStatus(true, name)))
        const state = yield select()
        const entityId = state.view.entityId
        if (!entityId) yield put(ctx.result(name, ResultOps.okNow([])))
        else {
            try {
                const items = yield call(
                    dao.getEntitiesFromNav, entitySet,
                        entityId,
                        navProperty)
                yield put.resolve(ctx.result(
                    name,
                    ResultOps.okNow(items.map(i => {
                        i.dataSource = name
                        return i
                    }))))
            } catch (e) {
                yield put.resolve(ctx.result(
                    name,
                    ResultOps.errorNow(
                        e, "Unable to retrieve activities from regarding via nav property.")))
            }
        }
        yield put(ctx.status(mkStatus(false, name)))
    }
}

export interface FactoryProps {
    dao: DAO
    entitySet: string
    navProperty: string
}

export function Factory(props: FactoryProps) {
    return Promise.resolve({
        regarding: dataSource(props.dao, props.entitySet, props.navProperty),
    })
}
