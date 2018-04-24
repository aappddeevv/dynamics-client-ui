/**
 * Common interfaces for data processing operations.
 */
import { Either } from "monet"

/** Content returned from a fetch. items and a timestamp. */
export interface Content<T> {
    items: Array<T>
    timestamp?: Date
}

/** Capture error information. */
export interface ErrorInfo {
    error?: Error
    message?: string
    timestamp?: Date
}

/**
 * Status may be provided prior to a result being produced.
 */
export interface Status {
    inProgress: boolean
    name: string
    message?: string
    timestamp?: Date
}

/** Makes a status and automatically sets the timestamp to now. */
export function mkStatus(inProgress: boolean, name: string, message?: string){
    return {
        inProgress,
        name,
        message: message ? message: undefined,
        timestamp: new Date(),
    }
}

/** Result of fetch. Left is error. */
export type Result<T=any, E=ErrorInfo> = Either<E, Content<T>>

/** 
 * Smart constructors for Result<T, ErrorInfo> instances. If you don't
 * use `E=ErrorInfo` you will need to create your own if you want.
 */
export const ResultOps = {
    ok: <T=any>(c: Content<T>): Result<T> => Either.Right(c),
    error: <T=any>(e: ErrorInfo): Result<T> => Either.Left(e),
    errorNow: <T=any>(error: Error, message?: string): Result<T> => Either.Left({
        error,
        message,
        timestamp: new Date(),
    }),
    okNow: <T=any>(items: Array<T> = []): Result<T> => Either.Right ({
        items,
        timestamp: new Date(),
    })
}

/**
 * A type often used when retrieving results that then get 
 * indexed by name. You'll probably wrap non-null results
 * in a Maybe so you have `Maybe<NamedArrayTuple>` which
 * you then filter and map (e.g. `collect` or `reduce`).
 */
export type NamedArrayTuple<T> = [string, Array<T>]

