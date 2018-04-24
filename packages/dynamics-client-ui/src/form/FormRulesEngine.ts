/**
 * Set of form utilities that overlap somewhat with
 * business rules and other Dynamics non-code based
 * configuration/customization features. You'll
 * need to ensure that the onLoad handle is called
 * so this module can obtain the proper form context.
 * The "settings" are module wide so you can
 * add as many "FormUtilities client" scripts to a form
 * as you want.
 *
 * A FormUtilities client script would look like:
 * ```
 * import * as FUtils from "dynamics-client-ui/form/FormUtilities" // or wherever
 * var cancellable = FUtils.add("rule1",
 *     // setRequired(predicate, attribute)
 *     FUtils.setRequired((fctx) =>
 *        fctx.getAttribute("new_yourfield").getValue() === null,
 *          "new_someotherfield"))
 * ```
 */
import "../Dynamics"
import { DEBUG } from "BuildSettings"

let fCtx: Xrm.FormContext | null

interface Action {
  execute: () => void
  revert: () => void
  init: (attr: Xrm.Attributes.Attribute) => void
}

class SetRequired implements Action {
  private attr: Xrm.Attributes.Attribute

  public execute(): void {
    console.log("SetRequired.execute")
    const current = this.attr.getRequiredLevel()
    console.log("current level", current)
    this.attr.setRequiredLevel(XrmEnum.AttributeRequirementLevel.Required)
  }

  public revert(): void {
    console.log("SetRequired.revert")
  }

  public init(attr: Xrm.Attributes.Attribute): void {
    console.log("SetRequired.init()")
    this.attr = attr
  }
}

const rules = {
}

/** A function to call remove a rule. */
export type Cancellable = () => void

export function onLoad(ectx) {
  if (DEBUG) console.log("Initializing form utilities.", ectx)
  if (ectx) fCtx = ectx.getFormContext()
}

export function onLoadRunRules(ectx) {

  const fc: Xrm.FormContext = ectx.getFormContext()
  const line1: Xrm.Attributes.StringAttribute = fc.getAttribute("address1_line1")
  line1.addOnChange(ectx => {
    console.log("line1 changed")

  })

}
