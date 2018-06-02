/**
 * Middleware needed to power the component. The main program
 * needs to correctly configure and create the middleware.
 */
import { DEBUG } from "BuildSettings"
const R = require("ramda")
import createSagaMiddleware, { SagaIterator, SagaMiddleware } from "redux-saga"
import {
    put, all, actionChannel, call, take, select,
    CallEffect, PutEffect, ActionChannelEffect, SelectEffect, TakeEffect,
} from "redux-saga/effects"
import { TypeKeys, DataAction } from "./data"
import { TypeKeys as ViewTypeKeys } from "./view"
import Actions from "./actions"
import {
    selectDataSources, selectEnhancers,
    selectFetchStatus, selectData,
} from "./selectors"
import { dedupe } from "./processors"
import {
    adjustActivityTypesFilter,
    adjustStateFilter,
    adjustOwnerOnlyFilter,
    adjustDateFilter,
    adjustOwnersFilter,
} from "./filter"
import { adjustSearchFilter } from "./search"
import {
    SagaFactoryContext, Enhancer, DataSource, SagaFactory, FetchContext,
} from "../datasources/interfaces"
import { ActivityItem } from "../datasources/datamodel"

import { defaultCreateActivityArgsBuilder } from "../createNewActivityUtils"

export {
    CallEffect, PutEffect, ActionChannelEffect, SelectEffect, TakeEffect,
    DataAction
}

export const defaultSagas: Array<() => SagaIterator> = [
    adjustActivityTypesFilter,
    adjustStateFilter,
    adjustOwnerOnlyFilter,
    adjustDateFilter,
    adjustSearchFilter,
    adjustOwnersFilter,
    processDataSourceBuffers,
    openFormWatcher,
    requestEntities,
]

function* startupMessage(name?: string) {
    let n = name ? (" : " + name) : null
    n = n || "."
    yield call([console, console.log], `Middleware started${n}`)
}

/**
 * Add the sources and enhancers to the redux state, run the specified sagas. You could
 * arrange to do this yourself. Always add the dedup processor. Include it if you
 * need to set the alwaysProcessors yourself.
 */
export function* startupSaga() {
    yield* startupMessage()
    yield put(Actions.Data.setAlwaysProcessors([dedupe()]))
}

/**
 * Note of the sagas in this module are dependent on the context. This factory
 * combines startupSaga and defaultSagas.
 */
export const sagaFactory: SagaFactory = (ctx: SagaFactoryContext) => {
    return Promise.resolve([startupSaga, ...defaultSagas])
}

/**
 * Consolidate dataSource buffers into a single buffer and run enhancers. Kept
 * as a separate message to allow us to optimize the fetch and post-processing
 * as separate steps later.
 */
function* processDataSourceBuffers() {
    if (DEBUG) console.log("Process buffer watcher started.")
    const requestChannel = yield actionChannel(TypeKeys.PROCESS_DATASOURCE_BUFFERS)
    while (yield take(requestChannel)) {
        yield call(processDataSourceBuffersCore)
    }
}

/**
 * Run the enhancers and consolidate fetch results into the final "activities" list.
 * Running enhancers may be very, very expensive. A
 * shallow clone is made ofeach original buffered entity. Subsequent enhancers
 * may also clone the entity.
 */
function* processDataSourceBuffersCore() {
    const dataState = yield select(selectData)
    const clone = dataState.cloneBeforeEnhancement || true
    const fetches = dataState.fetchResult
    let enhancers: Array<Enhancer<any, ActivityItem>> = yield select(selectEnhancers)
    if (enhancers.length === 0) enhancers = [Promise.resolve]

    // apply enhancers to all dataSource results then consolidate into a single buffer
    const dataPromises = R.flatten(
        R.toPairs(fetches).filter(fr => fr[1].isRight()) // for each non-error result
            .map(p => {
                return (p[1].right().items || []) // select out the result array
                    .map(item => { // for each item in result array
                        if (clone) item = { ...item } // maybe, maybe clone entity
                        return R.pipeP.apply(null, enhancers)(item) // apply the enhancers
                    })
            }))
    // call(Promise.all, dataPromises) gives runtime error !?!?!
    const newItems = yield call(() => Promise.all(dataPromises))

    yield put(Actions.Data.setBuffer(newItems))
    yield put.resolve(Actions.Search.updateSearchIndex()) // long running??
    yield put.resolve(Actions.Data.applyProcessors()) // may cause reordering
    yield put(Actions.View.selectFirstEntity())
}

function mkFetchContext(): FetchContext {
    return {
        /** Create a status update message. */
        status: Actions.Data.updateStatus,
        /** Indicate that you have results, either some failure or data. */
        result: Actions.Data.addResult,
    }
}

/** If a data source fails, how do we signal that? */
function* tryDataSourceCall(ds: DataSource, ctx: FetchContext) {
    try {
        yield ds(ctx)
    } catch (e) {
        console.log("Failed data source call", ds, e)
    }
}

/**
 * Run all dataSources in parallel then wait on all. Then process the buffer
 * using processDataSourceBuffersCore.
 */
function* requestEntities() {
    if (DEBUG) console.log("Process data sources watcher started.")
    const requestChan = yield actionChannel(TypeKeys.REQUEST_ENTITIES)
    while (yield take(requestChan)) {
        const dataSources = yield select(selectDataSources)
        yield put.resolve(Actions.Data.resetData())
        yield put(Actions.View.setLoading(true))
        const fctx = mkFetchContext() // could move to outer

        // Run in parallel, wait on all.
        // We could just spawn as well and run incremental cleanup after each one.
        yield all([...dataSources.map(ds => call(tryDataSourceCall, ds, fctx))])

        // Once all completes, process the returned data from each data source
        //yield put(Actions.Data.processDataSourceBuffers())
        // just call the core directly, skipping the extra message
        yield call(processDataSourceBuffersCore)

        // only after data fetch and dprocessing do we reset isLoading
        yield put(Actions.View.setLoading(false))
    }
}

/**
 * Open a form. There is no real change in state, so this is more a process message request.
 * Depending on the state, a quick create form can be used when the entity id is null
 * and the state is set correctly.
 */
export function* openFormWatcher() {
    if (DEBUG) console.log("Open form watcher started.")
    const requestChannel = yield actionChannel(ViewTypeKeys.OPEN_FORM)
    while (true) {
        let { type, ...rest } = yield take(requestChannel)
        const state = yield select()
        // Xrm must be present for this to work !!!
        const x = state.view.xrm
        const useQuickCreateForm = state.view.useQuickCreateForm
        if (x && x.Utility) {
            const fn = defaultCreateActivityArgsBuilder

            const { entityName, entityId, windowOptions, parameters, ...rest2 } = fn(x, rest)
            if (DEBUG) console.log("openFormWatcher: computed parameters\nentityName", entityName,
                "entityId", entityId,
                "windowOptions", windowOptions,
                "parameters", parameters,
                "rest", rest2,
                "useQuickCreateForm", useQuickCreateForm)

            x.Navigation.openForm({
                entityName,
                entityId, // maybe undefined indicating "create"
                ...windowOptions,
                ...rest2,
                useQuickCreateForm
            }, parameters)
        }
        else console.log("xrm is not defined. Unable to open entity form.")

        // notify view state of what?
        // ...
    }
}
