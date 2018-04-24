// fix 2018-01-08

export = PromisePool

declare class PromisePool<A> extends EventTarget {
  // skip GeneratorFunction as that is documented to be deprecated starting v3
  constructor(
    source: IterableIterator<Promise<A>> | Promise<A> | (() => (Promise<A> | void)) | A,
    concurrency: number,
    options?: PromisePool.Options<A>
  )

  concurrency(concurrency: number): number
  size(): number
  active(): boolean
  promise(): PromiseLike<void>
  start(): PromiseLike<void>

  addEventListener(type: string, listener: any): void
  removeEventListener(type: string, listener: any): void
}

declare namespace PromisePool {
  export interface Options<A> {
    promise?: Promise<A>
  }
}
