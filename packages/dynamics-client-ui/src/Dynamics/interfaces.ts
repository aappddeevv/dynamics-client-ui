/** 
 * Remove types from T that are assignable to U
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
 */
type Diff<T, U> = T extends U ? never : T

/** 
 * Remove types from T that are not assignable to U. 
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
 */
type Filter<T, U> = T extends U ? T : never

/** 
 * Omit right side from left side.
 * @see https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766 
 * @see https://github.com/pelotom/type-zoo
*/
export type Omit<T, K> = Pick<T, Exclude<keyof T, keyof K>>
//export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Not sure about this one. 
 * @see https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766 
 * @see https://github.com/pelotom/type-zoo
 */
export type Overwrite<T, U> = Omit<T, Extract<keyof T, keyof U>> & U
