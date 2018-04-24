/**
 * Misc eval support for promises i.e. limited support for monadic computations.
 * This is a mess. No good effect management in javascript/typescript.
 * Note that if you use this, you may need the typings in typings/es6-promise-pool
 * as the typings that come with the npm distibution are not correct.
 */
import * as PromisePool from "es6-promise-pool"

export interface Startable {
  start(): PromiseLike<void>
}

export interface Collectable<T> {
  collect(): Promise<Array<T>>
}

export type PromiseProducer<T> = IterableIterator<Promise<T>> | Promise<T> | (() => (Promise<T> | void))

/** Evaluate promises for their side effects limiting concurrency. void is returned. */
export function evalN_<T>(concurrency: number, fs: PromiseProducer<T>): Startable {
  return new PromisePool<T>(fs, 4)
}

/** Evaluate promises and return their results limiting concurrency. */
export function evalN<T>(concurrency: number, fs: PromiseProducer<T>): Collectable<T> {
  return new PromisePoolCollect<T>(fs, concurrency)
}

export const defaultConcurrency: number = 10

/**
 * @see https://github.com/timdp/es6-promise-pool/issues/51
 */
export class PromisePoolCollect<T> extends PromisePool<T> {
  /**
   * Constructor
   *
   * @param {Function} source - function to generate data
   * @param {Number} concurrency - amount of concurrency
   * @param {Object} options - key value pairs of options
   */
  constructor(source: PromiseProducer<T>, concurrency: number, options?: any) {
    super(source, concurrency, options)
    this.resolves = []
  }
  private resolves: Array<T>

  /**
   * Collect results, order is not guaranteed.
   *
   * @return {Promise}
   */
  public collect(): Promise<Array<T>> {
    super.addEventListener("fulfilled", (event) => {
      this.resolves.push((event as any).data.result)
    })
    return super.start().then(() => this.resolves) as Promise<Array<T>>
  }
}
