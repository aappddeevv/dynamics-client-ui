/**
 * Global event bus parent var. This module should only be loaded once for a
 * Dynamics form typically as part of loading form scripts. The eventbus can be
 * set on the global window using your bundler e.g. webpack with
 * libraryTarget="var". This script is usually loaded separately from other
 * scripts.
 */
import EventBus from "../Dynamics/EventBus"

/** Main instance for a form. */
export const eventbus = new EventBus()

/**
 * Arrange to have this called after the script is loaded.  Place the form
 * "global" instance into the specific, well-known location and coordinate with
 * your other form components to find it at the designated location. In this
 * case the well-known location is `window.eventbus`. Since this script is
 * loaded one iframe below the common parent, it is placed at
 * `window.parent.eventbus`.
 */
export function onLoad(ctx: any): void {
    // @ts-ignore
    window.parent.eventbus = eventbus
}
