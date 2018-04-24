/**
 * Utilitiy belt for working with forms and data validation/transformation.
 * DO NOT USE! DEPRECATED
 */

export const CommonRegex = {
    Integer: /^\d+$/,
    FloatingPoint: /^[+-]?\d+(\.\d+)?$/,
    Email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
}


/** Action: ETL */
class ETL {
    constructor() {
        this.controller = null
        this.source = null
        this.controls = []
        this.validator = null // func, takes extracted {context, value, clientData} as args
        this.transform = null // takes {value, clientData}
        this.setter = null // thunk that sets the value, takes (value)
        this.targets = [] // target attributes
        this.active = false
        this.message = null
        this.clientData = {}

        this.sourceAttribute = null
        this.crmControls = []
        this.attrValid = false
        this.errorId = this.source + "-errorid"
        this.targetAttributes = []
    }

    init = () => {
        const xrm = this.controller.xrm
        this.sourceAttribute = xrm.getAttribute(this.source)
        if (this.sourceAttribute) this.attrValid = true
        if (this.attrValid) this.crmControls = this.sourceAttribute.controls
        this.targets.forEach(t => this.targetAttributes.push(xrm.getAttribute(t)))

        // attach handlers to the change event
        if (this.attrValid) {
            this.sourceAttribute.addOnChange(this.onChangeHandler)
        }

        this.setter = (value) => {
            if (this.attrValid) {
                this.targetAttributes.forEach(t => t.setValue(value))
            }
            else {
                // do nothing
            }
        }
    }

    active = (flag) => { this.active = flag }
    deactivate = () => { this.active(false) }
    activate = () => { this.active(true) }

    /** Extract, validate, transform, then set. */
    onChangeHandler = (ctx) => {
        this.crmControls.forEach(c => c.clearNotification(this.errorId))
        if (this.sourceAttribute) {
            try {
                const get = this.sourceAttribute.getValue()
                const ok = this.validator({ contetx: ctx, value: get, clientData: this.clientData })
                if (!ok) {
                    this.crmControls.forEach(c => c.setNotification(this.message, this.errorId))
                }
                else {
                    const transformed = this.transform ?
                        this.transform({ value: get, clientData: this.clientData }) : get
                    if (this.setter) this.setter(transformed)
                }

            } catch (e) {
                console.log("Error in processing ETL for attribute", this.source, this)
            }
        }
    }
}



/** Controls multiple actions per form page. Handles new forms and onSave events properly. */
export class FormController {

    constructor(xrm = null) {
        this.xrm = xrm
        if (this.xrm === null || this.xrm === undefined)
            this.xrm = Xrm || window.parent.Xrm
    }

    /** All actions. */
    actions = []

    /**
     * @param source Name of entity attribute that are sources.
     * @param validator Function to validate content when its changed.
     * @param message Notification message for the control if validation fails.
     * @param targets Target attribute (or array) to set if valid value.
     */
    addValidation = (source, validator, message, targets, clientData = {}) => {
        const etl = new ETL()
        this.controller = this
        etl.source = source
        etl.validator = validator
        etl.targets = targets
        etl.clientData = clientData
        etl.activate()
        etl.init()
        actions.push(etl)
        return etl
    }

    activate = () => { }
    deactivate = () => { }
}



