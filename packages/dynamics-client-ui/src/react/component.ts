/**
 * Helpers for react components.
 */

export async function setStatePromise(that, newState) {
    return new Promise((resolve) => {
        that.setState(newState, () => {
            resolve()
        })
    })
}
