/**
 * Interfaces for engaging datasources as well as processing their results.
 */
import { Action } from "redux"
import { Status, Result, ErrorInfo, Content } from "@aappddeevv/dynamics-client-ui/lib/Data/interfaces"
import { SagaIterator } from "redux-saga"
import { Client } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { DAO } from "./DAO"
import { Either } from "monet"

export { ErrorInfo, Content, Either }

/**
 * Context for calling a datasource. Datasources should be
 * generator functions that yield status and result message
 * effects.
 */
export interface FetchContext {
    /** Call this to update status for a fetch. This is an action creator. */
    status(status: Status): Action
    /** Call this to set the result. This is an action creator. */
    result<T>(name: string, result: Result): Action
}

/**
 * Data source is just a saga iterator that yields actions
 * provided in the FetchContext. There is nothing stopping
 * it from yielding other actions.
 */
export type DataSource = (ctx: FetchContext) => SagaIterator

/** Data source with a name. Contains "name" and can be "applied" directly. */
export interface NamedDataSource extends DataSource {
    name: string
}

/**
 * Factory for making data sources. Since a data source probably needs
 * access to specific DAOs, all of the required init data should be
 * provided in the props. One factory can return a number of named
 * datasources.
 */
export type DataSourceFactory<T> = (props: T) => Promise<Record<string, DataSource> | {}>

/**
 * Process an array of returned data. Processors work on
 * a combined array of fetch results. Processors
 * after filter te data but can also sort them. Functor.
 */
export type Processor<T= any> = (i: Array<T>) => Array<T>

/** A cache of processors referenced by name so we can add/remove them by name. */
export interface NamedProcessor<T> {
    name: string
    processor: Processor<T>
}

/**
 * Enhance an individual item return from a data source. This allows
 * a common sense of enhancers to run after data source fetching
 * thereby simplifying what each data source needs to fetch. Flatmap friendly.
 */
export type Enhancer<T= any, U= any> = (t: T) => Promise<U>

/**
 * What's needed to create some of the sagas related to data.
*/
export interface FactoryContext {
    client: Client
    dao: DAO
}

/**
 * Factory for making enhancers. Enhancers are named so you can
 * manage the set prior to enabling them in the component. Note
 * that you cannot specify order in the output of a factory. Another
 * function would need to sequence them, if that's relevant.
 */
export interface EnhancerFactory {
    (ctx: FactoryContext): Promise<Record<string, Enhancer<any, any>> | {}>
}

export type SagaFactoryContext = FactoryContext

/**
 * A function that returns a Generator that yields efects.
 * A Generator that yields saga specific effects is called a SagaIterator.
 * It's the same thing as declaring `function *() { yield some-effect() }`
 * except we can give it a type signature.
 */
export type SagaFunc = () => SagaIterator

/**
 * Given a context containing data to create "data" related sagas, return
 * an array of SagaFunc wrapped in a promise. It's possible that some
 * SagaFuncs are created asynchronously and hence they are wrapped in a Promise.
 */
export type SagaFactory = (ctx: SagaFactoryContext) => Promise<Array<SagaFunc>>
