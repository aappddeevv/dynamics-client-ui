/** Type used to represent either success or failure. */
// https://github.com/martinmroz/result/blob/master/src/index.ts
export interface IResult<T, E> {

  /** Returns the value if result is `Ok`, `undefined` if `Err`. */
  ok(): T | undefined;

  /** Returns `true` if result is `Ok`, `false` if `Err`. */
  isOk(): boolean;

  /** Returns the error if result is `Err`, `undefined` if `Ok`. */
  err(): E | undefined;

  /** Returns `true` if result is `Err`, `false` if `Ok`. */
  isErr(): boolean;

  /**
   * Maps an `IResult<T, E>` to `IResult<U, E>` by applying the function provided
   * to a contained `Ok` value, leaving an `Err` value untouched.
   */
  map<U>(op: (value: T) => U): IResult<U, E>;

  /**
   * Maps an `IResult<T, E>` to `IResult<T, F>` by applying the function provided
   * to a contained `Err` value, leaving an `Ok` value untouched.
   */
  mapErr<F>(op: (error: E) => F): IResult<T, F>;

  /**
   * Returns `res` if the receiver is `Ok`, otherwise returns the `Err` value of
   * the receiver.
   */
  and<U>(res: IResult<U, E>): IResult<U, E>;

  /**
   * Invokes `op` if the receiver is `Ok`, returning the result.
   * If the receiver is `Err`, returns the `Err` value of the receiver.
   */
  andThen<U>(op: (value: T) => IResult<U, E>): IResult<U, E>;

  /**
   * Unwraps the result, yielding the contents of the receiver if `Ok`.
   * Throws an exception if the receiver is an `Err`.
   */
  unwrap(): T;
  
  /**
   * Unwraps the result, yielding the contents of the receiver if `Err`.
   * Throws an exception if the receiver is an `Ok`.
   */
  unwrapErr(): E;

  /**
   * Unwraps a result, yielding the content if the receiver is `Ok`.
   * If the receiver is an `Err`, returns `outherwise`.
   */
  unwrapOr(otherwise: T): T;

  /**
   * Unwraps a result, yielding the content if the receiver is `Ok`.
   * If the receiver is an `Err`, returns the result of invoking the parameter.
   */
  unwrapOrElse(otherwise: (error: E) => T): T;

}

/** Contains the success value. */
export class Ok<T, E> implements IResult<T, E> {
  private value: T;

  constructor(v: T) {
    this.value = v;
  }

  ok(): T | undefined {
    return this.value;
  }

  isOk(): boolean {
    return true;
  }

  err(): E | undefined {
    return undefined;
  }

  isErr(): boolean {
    return false;
  }

  map<U>(op: (value: T) => U): IResult<U, E> {
    return new Ok<U, E>(
      op(this.value)
    );
  }

  mapErr<F>(op: (error: E) => F): IResult<T, F> {
    return new Ok<T, F>(
      this.value
    );
  }

  and<U>(res: IResult<U, E>): IResult<U, E> {
    return res;
  }

  andThen<U>(op: (value: T) => IResult<U, E>): IResult<U, E> {
    return op(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapErr(): E {
    throw new Error('Attempting to unwrap error on Ok Result.');
  }

  unwrapOr(otherwise: T): T {
    return this.value;
  }

  unwrapOrElse(otherwise: (error: E) => T): T {
    return this.value;
  }

}

/** Contains the error value. */
export class Err<T, E> implements IResult<T, E> {
  private value: E;

  constructor(v: E) {
    this.value = v;
  }

  ok(): T | undefined {
    return undefined;
  }

  isOk(): boolean {
    return false;
  }

  err(): E | undefined {
    return this.value;
  }

  isErr(): boolean {
    return true;
  }

  map<U>(op: (value: T) => U): IResult<U, E> {
    return new Err<U, E>(
      this.value
    );
  }

  mapErr<F>(op: (error: E) => F): IResult<T, F> {
    return new Err<T, F>(
      op(this.value)
    );
  }

  and<U>(res: IResult<U, E>): IResult<U, E> {
    return new Err<U, E>(this.value);
  }

  andThen<U>(op: (value: T) => IResult<U, E>): IResult<U, E> {
    return new Err<U, E>(this.value);
  }

  unwrap(): T {
    throw new Error('Attempting to unwrap Err Result.');
  }

  unwrapErr(): E {
    return this.value;
  }

  unwrapOr(otherwise: T): T {
    return otherwise;
  }

  unwrapOrElse(otherwise: (error: E) => T): T {
    return otherwise(this.value);
  }

  }

