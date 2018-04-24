/**
 * Helpers for dealing with entity form state.
 */
import * as React from "react"
import * as Utils from "./Utils"
import * as PropTypes from "prop-types"
import { dynamicsShape, Dynamics, DynamicsProps, DynamicsContext } from "./Dynamics"
import { Notifier } from "./NotificationManager"
import { normalizeWith, cleanId } from "../Data/Utils"
const R = require("ramda")
import { DEBUG } from "BuildSettings"
import { Maybe } from "monet"
import { XRM } from "./xrm"
import Deferred from "./Deferred"
import { getFormContextP } from "./Utils"

/** A dynamics form attribute. Entity lookup by default. */
export interface Attribute<T = Xrm.LookupValue> {
    /** Standardized name e.g. "account" or "contact". Not sure this is needed. */
    name: string

    /** Dynamics logical name. */
    logicalName: string

    /** If the attribute currently has a value. */
    hasValue: boolean

    /** Dynamics attribute, it must be a lookup. */
    attribute: Xrm.Attributes.LookupAttribute

    /** Used to unregister the callback handler. */
    unregisterToken?: any

    /** Current value. Typically an array so you need index-0. */
    value: T | null
}

/**
 * Dynamics form attribute state. keys are dynamics attribute names
 * (logical names) and values are this module's Attributes.
 */
export type AttributeState = Record<string, Attribute>

/** Empty state. */
export const EmptyAttributeState = {}

/**
 * Add on change handlers to attributes. Return a new state. Existing
 * attributes in AttributeState are included in the return value untouched
 * so this is safe to call incrementally.
 */
export function connect(attributes: Array<string>,
    state: AttributeState,
    getAttribute: (n: string) => Xrm.Attributes.Attribute,
    onChangeHandler: (name: string, value: any) => void): AttributeState {

    const x: Array<Attribute<any>> = attributes.map(logicalName => {
        const existing = state[logicalName]
        if (existing) return Maybe.Some(existing)
        // get Dynamics attribute
        const attribute = getAttribute(logicalName)
        if (attribute) {
            const token = ctx => onChangeHandler(logicalName, attribute.getValue())
            attribute.addOnChange(token)
            // set hasValue
            const value = attribute.getValue()
            const hasValue = attribute ? (value !== null) : false
            return Maybe.Some({
                name: logicalName, logicalName, attribute, hasValue, unregisterToken: token, value,
            } as Attribute<any>)
        }
        else {
            // throw an error?
            if (DEBUG) console.log("connect: Unable to connect:", logicalName)
            return Maybe.None<Attribute<any>>()
        }
    }).filter(aOpt => aOpt.isSome()).map(aOpt => aOpt.some())
    return { ...state, ...normalizeWith("logicalName", x) }
}

/** Clears all values but setting it to null. */
export function clear(state: AttributeState): void {
    R.values(state).forEach(attr => {
        if (attr.attribute.getValue() !== null) {
            attr.attribute.setValue(null)
            attr.attribute.fireOnChange()
        }
    })
}

/** Something that can dispose. Very traditional OOP. */
export interface Disposable {
    dispose: () => void
}

/** EntityForm's props, *not* for the children of EntityForm (see EntityFormChildProps). */
export interface EntityFormProps extends Partial<DynamicsProps> {
    //isActive?: boolean
    entityId?: string | null
    entityName?: string | null
    userId?: string | null
    /** Track form save and re-grab ids, etc. Default is true. */
    trackSave?: boolean
    /** Pass in strict value for the FormContext, if available. */
    formContext?: Xrm.FormContext
}

export interface FormInfo {
    /** Whether you can change values on the form e.g. true => can use Attribute.setValue. */
    canChange: boolean | null
    /** entityId for the entity represented by the form. May be null if the entity is new w/o save. */
    entityId: string | null
    /** Name of entity in form. */
    entityName: string | null
    /** User id of user using the form. */
    userId: string | null
    /** See Xrmenum.FormType */
    formType: number | null
    /** Form context available as an effect. */
    formContextP: Promise<Xrm.FormContext>
    /** Convenience, a Notifier (a user message handler). */
    notifier: Notifier
}

/** 
 * Extend these for your child's props using EntityFormChildProps or 
 * Partial<EntityFormChildProps>. Form attributes are also injected once
 * they are connected to the form.
 */
export interface EntityFormChildProps extends FormInfo {
    /** Connect to Dynamics attributes so we get them as props. */
    connect: (attributes: Array<string>) => Promise<void>
    /** Clear attributes by setting their values to null. */
    clear: (attributes: Array<string>, fire: boolean) => Promise<void>
    /** Set an attribute value. */
    setValue: (attribute: string, value: any) => Promise<void>
}

export interface EntityFormState {
    stateCode: number | null
    //isActive: boolean | null
    canChange: boolean | null
    entityId: string | null
    ename: string | null
    entityName: string | null
    formType: number | null
}

export interface EntityFormContext extends DynamicsContext {
    /** A form context promise. */
    formContextP: Promise<Xrm.FormContext>
}

/** Not used yet. */
export const entityFormShape = PropTypes.shape({
    formContextP: PropTypes.instanceOf(Promise),
    ...Dynamics.childContextTypes,
})

/**
 * Inject Xrm state into a child and provide Xrm state through
 * a component's context. Can detect when the form has been saved
 * because the entityId will appear as a value in the child props.
 * Save handlers are run properly after the save. An update after
 * save is automatically called. Using this component as your parent
 * is alot like using `connect` in `react-redux`. If you wrap
 * with `EntityForm` you do *not* need to wrap with `Dynamics`.
 *
 * The Xrm.FormContext is obtained via FormContextHolder or window.parent.
 */
export class EntityForm<P extends EntityFormProps = EntityFormProps,
    S extends EntityFormState = EntityFormState> extends Dynamics<P, S> {

    constructor(props: P, context) {
        super(props, context)
        this.deferredFormContext = Deferred<Xrm.FormContext>()
        const self = this
        this.deferredFormContext.promise.then(fctx => {
            self.formContextResolved = true
            self.extractValues(fctx)
        })
        if (props.formContext) {
            // resolve immediately if a strict value was provided
            this.deferredFormContext.resolve(props.formContext)
        }
        this.state = {
            stateCode: null,
            //isActive: true,
            canChange: null,
            entityId: null,
            ename: null,
            entityName: null,
            formType: null,
        } as S
    }

    private formContextResolved: boolean = false
    private deferredFormContext: any
    // tslint:disable:variable-name
    private __className: string
    private __disposables: Array<Disposable> = []
    private __afterSaves: Array<() => void> = []
    /** Attributes live outside the react world, so make it instance var. */
    protected _attributeState: AttributeState = {}
    // tslint:enable:variable-name

    public getChildContext(): EntityFormContext {
        return {
            formContextP: this.deferredFormContext.promise,
            ...super.getChildContext(), // do I do this or does react aggregate within inheritance chain?
        }
    }

    public static defaultProps = {
        trackSave: true
    }

    public static childContextTypes = {
        formContextP: PropTypes.instanceOf(Promise),
        ...Dynamics.childContextTypes,
    }

    /** Can push a thunk. */
    get _afterSaves(): Array<() => void> { return this.__afterSaves }

    /** Can push a Disposable. */
    get _disposables(): Array<Disposable> { return this.__disposables }

    /** Get the class name. From Office Fabric. */
    public get className(): string {
        if (!this.__className) {
            const funcNameRegex = /function (.{1,})\(/;
            const results = (funcNameRegex).exec((this).constructor.toString())
            this.__className = (results && results.length > 1) ? results[1] : ""
        }
        return this.__className;
    }

    /**
     * Setup the FormContext if it is not already set. When resolved, force an update.
     */
    public componentDidMount(): void {
        const self = this
        if (!this.formContextResolved) {
            const p = getFormContextP()
            p.then(fctx => {
                if (DEBUG) console.log("EntityForm: form context set:", fctx)
                self.deferredFormContext.resolve(fctx)
            }).then(() => this.forceUpdate())
        }
    }

    public componentWillUnmount(): void {
        this.__disposables.forEach(d => {
            if (d.dispose) d.dispose()
        })
        this.__disposables = []

        // remove connections...
        R.values(this._attributeState).forEach(a => {
            if (a.attribute && a.unregisterToken)
                a.attribute.removeOnChange(a.unregisterToken)
        })
    }

    public componentWillMount(): void {
        const xrm = this.getXrm()
        if (xrm && !!this.props.trackSave)
            Utils.runAfterSave(
                xrm,
                () => true,
                () => {
                    this.__afterSaves.forEach(t => t())
                    this.forceUpdate()
                }, 500)
    }

    /**
     * Setup connections force an update so that values are propagated.
     * Connect processing runs when a form context becomes available.
     * @returns true if connections were created, false otherwise.
     */
    protected connect = async (attributes: Array<string>): Promise<boolean> => {
        if (DEBUG) console.log("EntityForm.connect", attributes)
        return this.deferredFormContext.promise.then(fctx => {
            if (!fctx) return Promise.resolve(false)
            const newState = connect(attributes,
                this._attributeState || {},
                (n: string) => {
                    // should we throw an error if its not found???
                    // shouldn't it be an error?
                    return fctx.getAttribute(n)
                },
                this.onChangeHandler)
            this._attributeState = newState
            this.forceUpdate()
            return Promise.resolve(true)
        })
            .catch(e => {
                console.log("Error while EntityForm.connect", e)
                return Promise.resolve(false)
            })
    }

    protected onChangeHandler = (name: string, value: any): void => {
        if (DEBUG) console.log("EntityForm.onChangeHandler", name, value, this._attributeState)
        const updated = { ...this._attributeState[name], hasValue: (value ? true : false), value }
        this._attributeState[name] = updated
        this.forceUpdate()
    }

    /** 
     * For each value in a connected state, clear its value. The returned promise
     * may resolve prior to the next render or not.
     */
    protected clear = (names: Array<string>, fire: boolean = false): Promise<void> => {
        names.forEach(n => this.setValue(n, null)) // sync
        this.forceUpdate() // kick off a render
        return Promise.resolve()
    }

    /** Give a FormContext, extract some values to pass to children as props on the next render. */
    protected extractValues = (fctx: Xrm.FormContext): void => {
        const entity = fctx.data.entity
        const ui = fctx.ui
        const stateAttr = fctx.getAttribute("statecode")
        const ename = entity.getEntityName()
        this.setState({
            stateCode: stateAttr ? stateAttr.getValue() : null,
            //isActive: stateAttr ? stateAttr.getValue() === 0 : true,
            canChange: ui.getFormType() !== 3 ? true : false,
            entityId: entity.getId() ? cleanId(entity.getId()) : null,
            ename,
            entityName: ename ? ename : (Utils.getURLParameter("typename") || null),
            formType: ui.getFormType(),
        })
    }

    /**
     * Setting value in dynamics attribute does *not* fire change event automatically,
     * which is good for us. If fire is true, `fireOnChange()` is called.
     */
    protected setValue = (name: string, value: any, fire: boolean = false): Promise<void> => {
        const x = this._attributeState[name]
        if (x) {
            x.attribute.setValue(value)
            x.attribute.fireOnChange()
        }
        return Promise.resolve()
    }

    public render() {
        const xrm = this.getXrm()
        const userId = xrm ? xrm.Utility.getGlobalContext().getUserId() : null
        return React.cloneElement(
            React.Children.only(this.props.children),
            {
                userId: userId ? cleanId(userId) : null,
                //isActive: this.state.isActive,
                canChange: this.state.canChange,
                entityId: this.state.entityId,
                entityName: this.state.entityName,
                formType: this.state.formType,
                connect: this.connect,
                clear: this.clear,
                setValue: this.setValue,
                formContextP: this.deferredFormContext.promise,
                notifier: this.context.notifier,
                ...this._attributeState,
            })
    }

}

export default EntityForm

/** Entity Form react context component. */
export const EntityFormReactContext = React.createContext<Partial<FormInfo>>({})
