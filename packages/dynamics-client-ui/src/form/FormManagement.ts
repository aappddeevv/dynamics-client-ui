/**
 * Data validation library that understands dynamics forms.
 * The module contains state that is module-wide and must be
 * initialized prior to use. See "onLoad" or "init".
 */
//import * as ValidateJS from "validate.js"
import { DEBUG } from "BuildSettings"

/** Module wide form context. */
let formContext: Xrm.FormContext

const NAME = "DataValidation"

/**
 * You must arrange for this to be called from a form's onLoad handler.
 * to initialize the module. Or you call it from your onLoad handler
 * in the source file where you included this module.
 */
export function onLoad(ctx: Xrm.Events.EventContext): void {
  init(ctx.getFormContext())
}

/**
 * Alternatively from onLoad, call this to initialize the module with the
 * form context directly.
 */
export function init(fctx: Xrm.FormContext): void {
  if (DEBUG) console.log(`${NAME} initialized with form context`, fctx)
  formContext = fctx
}

/** Module wide cache. */
const cache = new Map<string, any>()

//
// helpers
//
export function clearError(attributeName, notificationId): boolean {
  const c = formContext.getControl<Xrm.Controls.StandardControl>(attributeName)
  if (c)
    return c.clearNotification(notificationId)
  else
    return false
}

export function setError(attributeName, notificationId, msg): boolean {
  const c = formContext.getControl<Xrm.Controls.StandardControl>(attributeName)
  if (c)
    return c.setNotification(msg, notificationId)
  else return false
}

export function setAttributeValue(attributeName, value: any, fire: boolean = true): boolean {
  try {
    const a = formContext.getAttribute(attributeName)
    a.setValue(value)
    if (fire) a.fireOnChange()
    if (DEBUG) console.log(`${NAME}.setAttributeValue`, attributeName, value)
    return true
  } catch (e) {
    console.log("Error setting attribute value", attributeName, value, fire)
  }
  return false
}

export function getControlLabelOrElse(attributeName: string, orElse?: string): string {
  try {
    return formContext.getControl(attributeName).getLabel()
  } catch (e) {
  }
  return orElse || attributeName
}

/**
 * Callback arg for `registerOnChange`.
 */
export interface RegistrationCallbackArgs {
  formContext: Xrm.FormContext
  attributeName: string
  attribute: Xrm.Attributes.Attribute
  setError: (msg: string, key?: string) => boolean
  clearError: (key?: string) => boolean
  setValue: (attributeName: string, value: any, fire?: boolean) => void
  /** Deregister this handler from within the handler. */
  deregister: () => void
}

/**
 * Registration return value. Use deregister to derigester the callback handler.
 */
export interface RegistrationResult {
  success: boolean
  /** Deregister the callback. */
  deregister: () => void
}

export interface RegistrationOptions {
  /** On any change, automatically clear these attributes. */
  autoclear?: Array<string>
  /**
   * On any change, clear the current attribute error using the default attribute notification id.
   */
  autoClearErrorOnChange?: boolean
  /**
   * If on change and the attribute's value is null, automatically clear the error.
   * This uses the default attribute notification id.
   */
  autoClearErrorIfNull?: boolean
}

function mkAttributeKey(attributeName: string) { return `${attributeName}-Error` }

/**
 * Register callback on attribute value change  but using an enhanced callback arg to make it easier
 * to create simple logic for validaton and form changes.
 * @param attributeName Attribute name to monitor.
 * @param onChange On change handler.
 *
 * @todo Detect when a form cannot be changed and don't change it! e.g. read-only.
 */
export function registerOnChange(attributeName: string,
  onChange: (r: RegistrationCallbackArgs) => void,
  options?: RegistrationOptions): RegistrationResult {
  try {
    const attribute = formContext.getAttribute(attributeName)
    if (attribute) {
      const akey = mkAttributeKey(attributeName)
      const handlerKey = `${attributeName}-${Date()}`
      const deregister = () => {
        const h = cache.get(handlerKey)
        if (h) {
          cache.delete(handlerKey)
          attribute.removeOnChange(h)
        }
        else
          console.log("Unable to deregister handler with handler key", handlerKey)
      }
      const handler = (ectx: Xrm.Events.EventContext) => {
        const r = {
          attributeName,
          formContext,
          attribute,
          setError: (msg: string, key?: string) => {
            return setError(attributeName, key || akey, msg)
          },
          clearError: (key?: string) => {
            return clearError(attributeName, key || akey)
          },
          setValue: (aname: string, value: any, fire: boolean = true) => {
            setAttributeValue(aname, value, fire)
          },
          deregister,
        }
        // if read only form don't call anything
        const ft = formContext.ui.getFormType()
        if (ft === 3 || ft === 4) { // 3,4 => read-only form
          return
        }
        try {
          // run autoclears
          if (options && options.autoclear)
            options.autoclear.forEach(a => setAttributeValue(a, null, true))

          if ((options && options.autoClearErrorOnChange) ||
            (attribute.getValue() === null && options && options.autoClearErrorIfNull))
            clearError(attributeName, akey)

          // Call the user callback handler
          onChange(r)
        } catch (e) {
          console.log("Error running on change callback", e)
          createExpiringFormNotification("ERROR",
            `Internal error occured validating ${getControlLabelOrElse(attributeName)}. Please contact your administrator.`,
            30)
        }
      }
      attribute.addOnChange(handler)
      cache.set(handlerKey, handler)
      return {
        success: true,
        deregister,
      }
    }
  } catch (e) {
    console.log(`${NAME}: Error registering on change handler`, e)
  }
  return {
    success: false,
    deregister: () => { }
  }
}

export interface FormNotificationResult {
  /** whether the notification was successfully added. */
  success: boolean
  /** Remove the message immediately. */
  remove: () => void
}

// we should create a hash here...
const mkFormNotificationKey = (level, msg) => `${level}-${msg}`

/**
 * Create a form notification that removes itself after 'n' seconds.
 * @param level Level of message
 * @param msg Message to show.
 * @param removeAfterSeconds Remove the notification after a certain amount of time.
 */
export function createExpiringFormNotification(level: "ERROR" | "WARNING" | "INFO",
  msg: string, removeAfterSeconds?: number) {
  const id = mkFormNotificationKey(level, msg)
  const r = formContext.ui.setFormNotification(msg, level, id)
  const cb = removeAfterSeconds ? setTimeout(() => {
    formContext.ui.clearFormNotification(id)
  }, removeAfterSeconds * 1000) :
    null
  if (r)
    return {
      success: true,
      remove: () => {
        formContext.ui.clearFormNotification(id)
        if (cb) clearTimeout(cb)
      }
    }
  else
    return {
      success: false,
      remove: () => { }
    }
}

/**
 * Disable the "disableThis" attribute when "when" is set to null. Optionally clear
 * "disableThis" first if this function disables it. Do nothing if it is
 * already disabled. cb is called with the new disabled status when disabled
 * status changes on disableThis due to this function.
 */
export function disableOnNull(when: string, disableThis: string,
  clearFirst: boolean = false, cb?: (disabled: boolean) => void) {
  console.log("BEING CALLED", when, disableThis)
  return registerOnChange(when, r => {
    // see if we have a value
    const hasValue = !!r.attribute.getValue()
    const c = r.formContext.getControl<Xrm.Controls.StandardControl>(disableThis)
    console.log("disableOnNull", hasValue, c)
    if (!hasValue && c && !c.getDisabled()) {
      if (clearFirst) {
        const disabledAttr = r.formContext.getAttribute(disableThis)
        if (disabledAttr) disabledAttr.setValue(null)
      }
      c.setDisabled(true)
      if (cb) cb(true)
    } else if (hasValue && c && c.getDisabled()) {
      c.setDisabled(false)
      if (cb) cb(false)
    }
  })
}

/**
 * Call an callback when an attribute's value is set to null or becomes invalid.
 * This is *not* called if the value is set to a non-null value.
 */
export function actionOnNull(when: string, cb: (attributeName: string) => void) {
  return registerOnChange(when, r => {
    // see if we have a value
    const hasValue = !!r.attribute.getValue() && (r.attribute as any).isValid()
    if (!hasValue) cb(when)
  })
}
