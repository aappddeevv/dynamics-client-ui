/**
 * Misc stuff for worknig with data for activities.
 */
import R = require("ramda")
import {
    Enhancer, DataSource, SagaFunc,
} from "./interfaces"
import { put } from "redux-saga/effects"
import { Actions } from "../redux/data"

/**
 * Create sagas that initialize app state with Enhancers and DataSources.
 * Use aggregators Utils.combineEnhancers, Utils.combineDatasourceFactories to combine multiple
 * EnhancerFactorys and DataSourceFactorys as needed.Then pass the results
 * of using these aggregators to this function.When the SagaFuncs are run, they
 * will modify the application state. This is all pure function composition.
 */
export function createSagas(
    enhancers: Promise<Record<string, Enhancer<any, any>>>,
    dataSources: Promise<Record<string, DataSource>>): Promise<Array<SagaFunc>> {

    const enhancersP: Promise<SagaFunc> = enhancers.then(f => {
        return function* () { yield put(Actions.setEnhancers(Object.values(f))) }
    })
    const dataSourcesP: Promise<SagaFunc> = dataSources.then(f => {
        return function* () { yield put(Actions.setDataSources(Object.values(f))) }
    })

    return Promise.all([dataSourcesP, enhancersP]).then(inits => {
        return R.flatten(inits) as Array<SagaFunc>
    })
}

export default createSagas
