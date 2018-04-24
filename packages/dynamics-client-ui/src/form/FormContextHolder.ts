/**
 * Captures the form context and stores it in
 * a well known location for other components,
 * especially Web Resources.
 *
 * Since form scripts and web resources live
 * in a hierarchy of iframes, ensure that
 * we embed that knowledge here, once.
 *
 * Note that MS documents are incomplete about
 * the context and its validness after a callback
 * function exits.
 *
 * Usage: arrange to have onLoad called
 * as a form's onload handler. This module is
 * typically imported separately as a form script.
 */

import { Deferred } from "../Dynamics/Deferred"

const p = Deferred()

/**
 * Arrange to have this function called
 * with the form's OnLoad event. This is
 * the only way to guarantee that we obtain
 * a valid form context without going through
 * the deprecated Xrm.Page.
 *
 * This form assumes that form scripts load
 * into a frame hierarchy that is one below
 * a parent that webresources can also access.
 */
export function onLoad(ctx: any): void {
    p.resolve(ctx.getFormContext())
}

/**
 * Attach our promise one level up so other frames can find it.  To reach the
 * promised land, use `FormContextP` to obtain the promise that you can chain
 * off of. Use Promise.race (or equivalent) to timeout waiting. See `getXrmP.ts`
 * for a promise that waits for Xrm.FormContext through this or Xrm.Page. You can
* also just check for it using the strict value `(window.parent as any).FormContextP`.
 */
// @ts-ignore
window.parent.FormContextP = p.promise
