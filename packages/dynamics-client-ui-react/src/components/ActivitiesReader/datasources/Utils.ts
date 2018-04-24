/**
 * Misc stuff for worknig with data for activities.
 */
import { Metadata, EntityDefinition } from "@aappddeevv/dynamics-client-ui/lib/Data"
import R = require("ramda")
import {
    DataSourceFactory, FactoryContext, EnhancerFactory,
    Enhancer, DataSource, SagaFunc, SagaFactory, SagaFactoryContext,
} from "./interfaces"
import { put } from "redux-saga/effects"

/**
 * Enhanced EntityDefinition with label, value and creation permission controls.
 */
export interface EntityDefinitionE extends EntityDefinition {
    label: string
    value: string
    image?: string | null
    allowNew?: boolean
}

/**
 * Fetch entity definitons for all activity types. This does not
 * include the annotation entity type.
 */
export function fetchActivityTypes(m: Metadata): Promise<Array<EntityDefinitionE>> {
    return m.getAllActivityTypes().then(ref =>
        ref.map(entry => ({
            ...entry,
            label: entry.DisplayName!,
            value: entry.LogicalName!,
            image: entry.IconSmallName || null,
        })))
}

/**
 * Combine multiple DataSourceFactorys together. Keys are combined into one object
 * Last DataSourceFactory wins.
 */
export function combineDataSourceFactories<T>(factories: Array<DataSourceFactory<any>>): DataSourceFactory<T> {
    return (args: T) => Promise.all(factories.map(f => f(args))).then(R.mergeAll)
}

/**
 * Combine emultiple EnhancerFactorys into one. Last EnhancerFactory wins.
 */
export function combineEnhancerFactories(factories: Array<EnhancerFactory>): EnhancerFactory {
    return (ctx: FactoryContext) =>
        Promise.all(factories.map(f => f(ctx))).then(R.mergeAll)
}

/**
 * Create an enhancers that runs the specified Enhancers in order, left to right, if that's important to you.
 * @param enhancers Enhancers to run in order.
 */
export function combineEnhancers<I = any, O = any>(...enhancers: Array<Enhancer<any, any>>): Enhancer {
    return R.apply(R.pipeP, enhancers) as Enhancer<I, O>
}

/**
 * Combine multiple SagaFactories into one. We have a cast in there because the types gets lost.
 * @param factories Factories to combine.
 */
export function combineSagaFactories(factories: Array<SagaFactory>): SagaFactory {
    return (ctx: SagaFactoryContext) =>
        Promise.all(factories.map(f => f(ctx))).then(arrOfArr => R.flatten(arrOfArr))
}
