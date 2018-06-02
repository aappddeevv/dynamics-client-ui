/**
 * Helpers for react components.
 */
import * as React from "react"

export async function setStatePromise(that, newState) {
    return new Promise((resolve) => {
        that.setState(newState, () => {
            resolve()
        })
    })
}

/** Transform a component into another component. */
export type HOC<P=any> = (c: React.ComponentType<P>) => React.ComponentType<P>