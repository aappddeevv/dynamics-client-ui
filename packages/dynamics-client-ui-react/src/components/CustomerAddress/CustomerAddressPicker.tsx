/**
 * Show addresss associated with an account and
 * stash a label and id into the entity object.
 * Allows us to use addresses in other entities which
 * is not allowed in normal dynamics. Heavily parameterized
 * so that you can store the address label or id flexibly on the target
 * entity. For example, store a "parentcustomeraddressid" attribute
 * on the opportunity entity whose address should be associated with
 * the parentcustomerid pre-existing attribute.
 */
import * as React from "react"
import * as ReactDOM from "react-dom"
import { Requireable } from "prop-types"
import {
    EntityForm, EntityFormChildProps, EntityFormContext, Attribute,
} from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import {
    CustomerAddressDAO, CustomerAddress, fakeName,
    isBlank, NullCustomerAddress,
} from "./CustomerAddressDAO"
import { XRM, cleanId, mkClient, Client } from "@aappddeevv/dynamics-client-ui"
import { DEBUG, API_POSTFIX } from "BuildSettings"
const R = require("ramda")
import { setStatePromise } from "@aappddeevv/dynamics-client-ui/lib/react/component"
import { Fabric } from "office-ui-fabric-react/lib/Fabric"
import { Dropdown, DropdownMenuItemType, IDropdownOption } from "office-ui-fabric-react/lib/Dropdown"
import { DirectionalHint } from "office-ui-fabric-react/lib/Callout"
import { Label } from "office-ui-fabric-react/lib/Label"
import { ResponsiveMode } from "office-ui-fabric-react/lib/utilities/decorators/withResponsiveMode"
const styles = require("./CustomerAddresses.css")
import { getClassNames } from "./CustomerAddresses.classNames"
const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
import cx = require("classnames")
import { KeyAndText } from '@aappddeevv/dynamics-client-ui/lib/Data'
import { defaultEnhancer } from "./DataModel"


/** Fetch addresses given an entity id (=_parentid_value on customeraddress). */
export type Fetcher<T extends CustomerAddress = CustomerAddress> = (entityId: string) => Promise<Array<T>>

export interface SelectValueContext {
    entityId: string | null
    entityName: string | null
}

/**
 * Select a  value from a list. For example,
 * if the form is Opportunity and you have placed an attribute location on
 * Opportunity that is tied to the parentaccount attribute, if the user
 * selects a different parentaccount, you may want to return a default
 * address for that account e.g. address 0 or one with the name HQ.
 * An effect is used to allow you to hit the server to determine a default.
 *
 * @param fctx The Xrm.FormContext. Use this if you need data from the form.
 * @param addresses List of `customeraddress`es to select from.
 * @returns The selected CustomerAddress object or null, for no selection.
 */
export type SelectValue<T extends CustomerAddress = CustomerAddress> = (
    fctx: Xrm.FormContext, addresses: Array<T>) => Promise<T | null>

/**
 * Default address detail rendering. You need to render just
 * enough address that the dropdown shows clearly enough in the DOM unless
 * you inject this into the parent of the WebResource iframe.
 */
export const defaultRenderLines = (a: CustomerAddress | null): JSX.Element | null => {
    return (
        < div className={cx(fstyles.flexVertical, styles.addressDisplay)} >
            {Pair("Line 1", a && a.line1 ? <Label>{a.line1}</Label> : null)}
            {Pair("Line 2", a && a.line2 ? <Label>{a.line2}</Label> : null)}
            {Pair("City/State", a && (a.city || a.stateorprovince) ? <Label>{a.city}, {a.stateorprovince}</Label> : null)}
            {Pair("Postalcode", a && a.postalcode ? <Label>{a.postalcode}</Label> : null)}
        </div>
    )
}

/**
 * External handler when the selected address changes. The selection could be null. Xrm.FormContext allows
 * you to manipulate the dynamics form such as setting values. The most important value to set is the
 * one that stores some form of identification as to which address in the set is selected e.g.
 * the address id, address number or address name.
 */
export type OnAddressChangeHandler<T extends CustomerAddress = CustomerAddress> = (address: T | null, fctx: Xrm.FormContext) => void

/**
 * The props for the customer address selection view. It expects properties such as those provided
 * by EntityForm as well as a few more. Yes, I'm lazy.
 */
export interface Props<T extends CustomerAddress> extends Partial<EntityFormChildProps> {
    className?: string
    /**
     * The attribute containing the entity id of the object that has customer
     * addresses (=_parentid_value on CustomerAddress). Typically this is some
     * type of lookup on Account or Contact. The dynamics form attribute indicated
     * by this property is observed for value changes since that indicates the list
     * of selectable addresses must change.
     */
    entityIdAttribute?: string | null

    /**
     * Callback when the address changes. Allows you to set other attributes on the form.
     * An onChange handler convenience function can be created using onChangeSetValues.
     */
    onChange?: OnAddressChangeHandler

    /** Fetch customeraddress records for a given entity id e.g. account. */
    fetcher: Fetcher<T>

    /**
     * Obtain a default address when the list of addresses changes because
     * the entity linked to the addresses changed.
     * If not provided, then the default "selected address" is null when the
     * dynamics form value specified by entityIdAttribute changes.
     */
    selectDefaultValue?: SelectValue<T>

    /**
     * Get the initial value when the component first renders. Different from
     * `getDefaultValue` in that this function is called once. If not provided
     * or returns null, it is assumed that there is no initial value
     * and onChange will be called with a null address at the start, once. You
     * should also return null if there is no match between what is stored
     * in the entity record and the list of customer addresses indicated
     * by entityIdAttribute (and hence indicates a bad id and should be cleared).
     */
    selectInitialValue?: SelectValue<T>

    /**
     * Obtain the dynamics entity id that represents the parent of the addresses
     * So if you have an account lookup on the Opportunity form and you want the
     * addresses of the account, this function returns a dynamics entity id for
     * the accounts by accessing the form's account lookup attribute and returning
     * the id. The id is used to call the fetcher when data is needed.
     */
    getId: (fctx: Xrm.FormContext) => Promise<string | null>

    /**
     * Render the detail lines of the selected address for display.
     * The default is defaultRenderLines.
     */
    renderLines?: (a: T | null) => JSX.Element | null

    /** Enhance a standard CustomerAddress record with key and text. */
    enhancer?: (address: T) => T & KeyAndText

    /** Language strings for the dropdown. */
    lang?: {
        dropDown: {
            placeholder: string,
            ariaLabel: string,
        },
    }
}

export const defaultLang = {
    dropDown: {
        placeholder: "Select address",
        ariaLabel: "Select address",
    },
}

/*
 * Mapping between customeraddress logical name and the target attribte
 * on the entity. For example, to store the customeraddressid into an
 * attribute new_customeraddressid you have created on the entity, use
 * a mapping { customeraddressid: "new_customeraddressid" }. Target attributes
 * must be a string or match the attribute tye on customeraddressid.
 */
export function onChangeSetValues(mappings: Record<string, string>, fire: boolean = true): OnAddressChangeHandler {
    return R.curry(defaultEtl)(R.__, R.__, mappings, fire)
}

export interface State<T> {
    /** The selected item or null indicating no selection. */
    selectedItem: (T & KeyAndText) | null
    /** List of options for to select from. */
    options: Array<T & KeyAndText>
    /** true when the initial value is being set based on data from the form (or wherever). */
    initProcessing: boolean
}

const NAME = "CustomerAddressPicker"

/**
 * Shows "customer" addresses taken from an entity's list
 * of "customeraddress"es entities. On a form, an attribute
 * holds an "id" that represents an entity that is the parent to some addresses.
 * For example, on an opportunity form, you may add the parentaccountid attribute
 * (that attribute is actually already on the opportunity record).
 * You would want any address for the opportunity to come from the list of
 * customeraddresses for that parentaccountid.
 *
 * "id" could be the customeraddress id or its number or its name, or some
 * other attribute you decide is unique within the set of addresses belong to
 * all address associated with with the parent entity (i.e.
 * customeraddress._parentid_value). You need to provide matching functions
 * to locate the "current" and "default" address given a list of addresses.
 */
export class CustomerAddressPicker<T extends CustomerAddress = CustomerAddress> extends React.Component<Props<T>, State<T>> {

    constructor(props, context) {
        super(props, context)
        this.state = {
            selectedItem: null,
            options: [],
            initProcessing: false,
        }
    }

    public context: EntityFormContext

    public static contextTypes = {
        ...EntityForm.childContextTypes,
    }

    /** Use props.enhancer or a default to enhance the fetched record. */
    private enhance = (addr: T): T & KeyAndText => {
        return this.props.enhancer ? this.props.enhancer(addr) : defaultEnhancer(addr)
    }

    /** Use fetcher to fetch addresses and prep them for use in the UI. */
    protected fetch = async (entityId: string | null): Promise<Array<T & KeyAndText>> => {
        if (this.props.fetcher && entityId)
            return this.props.fetcher(entityId).
                then(r => {
                    const options = r
                        .filter(a => !isBlank(a))
                        .map(this.enhance)
                    if (DEBUG) console.log(`${NAME}.fetch: fetched addresses after prep`, options)
                    return options
                })
        else return []
    }

    /**
     * Fetch data for the id, set the list of addresses, calculate and set the selection.
     * @param entityId Id of the object that is linked to the addresses i.e. customeraddress._parentid_value
     * @param select Select a default address given a list of addresses.
     */
    protected initData = async (entityId: string | null, select: (addresses: Array<T>) => Promise<T | null>): Promise<any> => {
        if (entityId)
            return this.fetch(entityId)
                .then(options =>
                    select(options)
                        .then(this.fireOnChangeIfNull)
                        // @ts-ignore
                        .then(selectedItem => this.setState({
                            options: [NullCustomerAddress, ...options],
                            selectedItem,
                        }))
                        .then(() => options))
                .catch(e => {
                    console.log("Error retrieving addresses", e)
                    if (this.context.notifier)
                        this.context.notifier.add({ message: "Error retrieving addresses", level: "ERROR", removeAfter: 10 })
                    return []
                })
        else if (entityId === null)
            return setStatePromise(this, { options: [] })
                .then(() => this.fireOnChangeIfNull(null))
    }

    /**
     * If the selectedItem is null, call this.onChange to inform client it should be reset.
     * This is only used when obtaining an initial value so if it comes back null
     * we need to ensure that onChange listeners get a chance to process it because its semantically
     * a reset i.e. a stale value stored in the entity or it really is "no selection".
     * Essential this is performing an effectful operation and passing through the value.
     */
    protected fireOnChangeIfNull = async (selectedItem: T | null): Promise<T | null> => {
        if (!selectedItem) this.onChange(null)
        return selectedItem
    }

    /** Select an address from the list for the initial value when the form first displays. */
    protected selectInitialValue = (addresses: Array<T>): Promise<T | null> => {
        const self = this
        console.log(`${NAME}.selectInitialValue`, self.props, addresses, this.props.selectInitialValue)
        return this.props.selectInitialValue ?
            this.context.formContextP.then(fctx => self.props.selectInitialValue!(fctx, addresses))
            : Promise.resolve(null)
    }

    /**
     * Given an array of addresses, use props.selectDefaultValue to obtain a default or return null.
     * This method is called when a new entity is selected that selects a new set of addresses.
     */
    protected selectDefaultValue = (addresses: Array<T>): Promise<T | null> => {
        const self = this
        return this.props.selectDefaultValue ?
            this.context.formContextP.then(fctx => self.props.selectDefaultValue!(fctx, addresses)) :
            Promise.resolve(null)
    }

    public componentDidMount() {
        console.log(`${NAME}.componentDidMount`)
        const self = this
        const connects = this.props.entityIdAttribute ? [this.props.entityIdAttribute] : []
        if (this.props.connect && connects.length > 0) {
            setStatePromise(self, { initProcessing: true })
                .then(() => self.context.formContextP.then(fctx =>
                    self.props.connect!(connects)
                        .then(() =>
                            self.updateData(self.props, self.selectInitialValue)),
                ))
                .then(() => setStatePromise(self, { initProcessing: false }))
        }
        else {
            self.updateData(self.props, self.selectDefaultValue)
        }
    }

    /** Look for changes in the attribute holding the core entity that has addresses on it. */
    public componentWillReceiveProps(nextProps, nextContext) {
        console.log(`${NAME}.componentWillReceiveProps`, this.state.initProcessing)
        if (!this.state.initProcessing) {
            // source of "id" value changes
            if (nextProps.entityIdAttribute !== this.props.entityIdAttribute)
                this.updateData(nextProps, this.selectDefaultValue)
            // the value that holds the "id" itself changed
            else if (R.path([nextProps.entityIdAttribute, "value"], nextProps) !==
                R.path([this.props.entityIdAttribute as any, "value"], this.props))
                this.updateData(nextProps, this.selectDefaultValue)
        }
    }

    /** Update customer address list and selection. */
    protected updateData = async (props: Props<T>, select: (addresses: Array<T>) => Promise<T | null>): Promise<any> => {
        const self = this
        const fctx = await self.context.formContextP
        const id = await this.props.getId(fctx)
        id ? self.initData(id, select) : self.initData(null, select)
    }

    /**
     * If the selected option is the semantic null, set a hard null on selectedItem, otherwise
     * set state.selectedItem to the option selected.
     */
    protected onChange = (option) => {
        if (DEBUG) console.log(`${NAME}.onChange: option`, option)
        if (option && option.key === "_NULL_") option = null
        this.setState({ selectedItem: option })
        const self = this
        if (this.props.onChange)
            this.context.formContextP.then(fctx => self.props.onChange!(option, fctx))
    }

    public render() {
        const a = this.state.selectedItem
        const renderLines = this.props.renderLines || defaultRenderLines
        return (
            <div className={cx("ttg-CustomerAddressPicker", styles.addressSelector, this.props.className)} >
                {this.renderDropdown()}
                {renderLines(a)}
            </div>
        )
    }

    protected renderDropdown = () => {
        const lang = { ...defaultLang, ...this.props.lang }
        return <Dropdown
            disabled={this.state.options.length <= 1 && !!this.props.canChange} // _NULL_ is always added
            responsiveMode={ResponsiveMode.large}
            placeHolder={lang.dropDown.placeholder}
            id="ttg-CustomerAddressPicker-dropdown"
            ariaLabel={lang.dropDown.ariaLabel}
            required={false}
            options={this.state.options}
            selectedKey={this.state.selectedItem ? this.state.selectedItem.key : undefined}
            onChanged={this.onChange}
        />
    }
}

/**
 * Given a string label and a ReactNode, render it horizontally in a div.
 * CSS includes: addressLine, addressLineLabel and addressLineValue and
 * addressLineNoValue.
 */
export function Pair(label: string, renderable?: React.ReactNode | null): JSX.Element {
    return (
        <div className={cx(fstyles.flexHorizontal, "addressLine")} >
            <Label className={cx(styles.label, "addressLineLabel")}>{label}</Label>
            <div className={cx(styles.value, "addessLineValue")}>
                {renderable ? renderable : <span className="addressLineNoValue">-----</span>}
            </div>
        </div>)
}

export type Transformer<T extends CustomerAddress = CustomerAddress> = (a: T | null) => T

/**
 * Set values on the form with the FormContext and CustomerAddress.
 * The dynamics onChange handlers are not fired on the attribute unless fire=true.
 * The mapping is: dynamics form attribute (the target) -> transformer.
 * You can use this function to create an OnAddressChangeHandler.
 */
export function etl(fctx: Xrm.FormContext, address: CustomerAddress | null,
    mapping: Record<string, Transformer<any>>, fire: boolean = true): void {
    if (fctx) {
        R.toPairs(mapping).forEach(tup => {
            try {
                const attr = fctx.getAttribute(tup[0])
                if (attr) {
                    attr.setValue(tup[1](address))
                    if (fire) attr.fireOnChange()
                }
            } catch (e) {
                console.log("Error trying to set/get values in etl", tup, e)
            }
        })
    }
}

/**
 * Take a mapping (address property => form attribute), then call etl() with those mappings. If fire is not true,
 * the dynamics form will not know that the values changed and the form will not be marked dirty.
 */
export const defaultEtl = (address: CustomerAddress | null, fctx: Xrm.FormContext, spec: Record<string, string>, fire: boolean = true) => {
    const maps = R.toPairs(spec).map(tup => [tup[1], a => a ? a[tup[0]] : null]) as Array<[string, Transformer<any>]>
    etl(fctx, address, R.fromPairs(maps), fire)
}

/** Compare value to customeraddress.name and customeraddress.customeraddressid. */
export function defaultMatch<T extends CustomerAddress>(value: string | null, addresses: Array<T>): T | null {
    if (!value) return null
    const byName = R.find(a => a.name === value, addresses)
    const byId = R.find(a => a.customeraddressid === value, addresses)
    const iv = byName ?
        byName :
        (byId ? byId : null)
    return iv
}

/**
 * Get a value from the form using valueAttribute and try and match it to one of the customeraddresses using match.
 * If there is a match, return the customeraddress otherwise return null. This function assumes
 * that the attribute indicated by valueAttribute returns a string value.
 * @param fctx Xrm.FormContext for accessing a form.
 * @param addresses List of addresses to select from.
 * @param valueAttribute The attribute holding the initial value on the form.
 * @param match A general match function that takes the value from the form and compares it to the addresses.
 */
export async function findMatchFromAttribute<T extends CustomerAddress = CustomerAddress>(
    fctx: Xrm.FormContext,
    addresses: Array<T>,
    valueAttribute: string | null,
    match: (value: string, addresses: Array<T>) => T | null = defaultMatch): Promise<T | null> {
    if (valueAttribute) {
        const attr = fctx.getAttribute<any>(valueAttribute)
        if (attr) {
            if (attr.getAttributeType() === "string") {
                const v = attr.getValue()
                const iv = match(v, addresses)
                if (DEBUG) console.log("findMatchFromAttribute: Initial address value found", attr.getName(), v, iv)
                return iv
            }
        }
    }
    return null
}

/**
 * Return the id in the lookup attribute on the form. The attribute can be a string or lookup. You
 * can use this to create your own `Props.getId`.
 */
export async function getIdFrom(fctx: Xrm.FormContext, source: string | null): Promise<string | null> {
    if (!source) return null
    const a = fctx.getAttribute(source)
    if (a) {
        const value = a.getValue()
        switch (a.getAttributeType()) {
            case "lookup": {
                if (Array.isArray(value))
                    return (value && (value.length === 0 || value[0].id === null)) ?
                        null :
                        cleanId(value[0].id)
            }
            default: {
                return value ? value : null
            }
        }
    }
    return null
}
