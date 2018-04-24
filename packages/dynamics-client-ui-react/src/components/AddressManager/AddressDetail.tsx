import * as React from "react"
import { CustomerAddress } from '../CustomerAddress/DataModel'
import { Label } from "office-ui-fabric-react/lib/Label"
import { TextField } from "office-ui-fabric-react/lib/TextField"
import { IStyle, concatStyleSets, mergeStyleSets, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { css, memoizeFunction } from "office-ui-fabric-react/lib/Utilities"
import { AddressEditor } from '.';
import { POINT_CONVERSION_COMPRESSED } from 'constants'
import { KeyCodes, IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { FocusZone, FocusZoneDirection } from "office-ui-fabric-react/lib/FocusZone"
import { ConsoleErrorHandler } from '../../../../dynamics-client-ui/lib/Dynamics/ErrorHandler'
import { Attribute, ControlProps } from "./Attribute"
import * as Meta from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"
import { Maybe } from "monet"

export type T = CustomerAddress

export interface AddressDetailProps {
    className?: string | null
    entity: Maybe<T>
    setDirty: (v: boolean) => void
    setEditing: (v: boolean) => void
}

export interface State {
    /** Attribute currently under edit. */
    attributeInEdit: string | null
}

export class AddressDetail extends React.Component<AddressDetailProps, State> {

    constructor(props) {
        super(props)
        this.state = {
            attributeInEdit: null
        }
    }

    protected onRequestEditMode = (id: string) => {
        console.log("onRequestEditMode")
        this.setState({ attributeInEdit: id })
        this.props.setEditing(true)
    }

    protected exitEditMode = () => {
        console.log("exitEditMode")
        this.setState({ attributeInEdit: null })
        this.props.setEditing(false)
    }

    public UNSAFE_componentWillReceiveProps(nextProps: AddressDetailProps) {
        if (nextProps.entity.map(e => e.customeraddressid).orSome("") !==
            this.props.entity.map(e => e.customeraddressid).orSome("")) {
            this.setState({ attributeInEdit: null })
        }
    }

    protected activeItemChanged = (el?: HTMLElement) => {
        console.log("activeItemChaged", el)
        if (el) {
            // extract data-id which has "attribute" that is now the active item
            const dataId = el.attributes["data-id"]
            console.log("activeItemChanged.dataId", dataId)
            if (dataId) {
                this.setState({ attributeInEdit: dataId })
            } else console.log("nil dataId")
        } else {
            // no active el?
        }
    }

    public render() {
        const props = this.props
        const x = () => ({
            "data-is-focusable": true,
        })
        return (
            <div
                className={mergeStyles(this.props.className, {
                    display: "flex",
                    flexDirection: "column",
                    height: "calc(100% - 30px)"
                })}
                onKeyDown={e => {
                    //console.log("key press", e)
                    if (e.keyCode === KeyCodes.escape) {
                        this.exitEditMode()
                        e.stopPropagation()
                    }
                }}
            >
                <FocusZone
                    isCircularNavigation={true}
                    //direction={FocusZoneDirection.vertical}
                    onActiveElementChanged={this.activeItemChanged}

                >
                    <Attribute
                        id="name"
                        label="Name"
                        isEditing={"name" === this.state.attributeInEdit}
                        requestEditMode={this.onRequestEditMode}
                        {...makeTextValue("name", props.entity.map(e => e.name).orSome(""), x)}
                    />
                    <Attribute
                        id="line1"
                        label="Line 1"
                        requestEditMode={this.onRequestEditMode}
                        isEditing={"line1" === this.state.attributeInEdit}
                        {...makeTextValue("line1", props.entity.map(e => e.line1).orSome(""), x)}
                    />
                    <Attribute
                        id="postalcode"
                        label="Zip Code"
                        requestEditMode={this.onRequestEditMode}
                        isEditing={"postalcode" === this.state.attributeInEdit}
                        {...makeTextValue("postalcode", props.entity.map(e => e.postalcode).orSome(""), x)}
                    />
                    <Attribute
                        id="city"
                        label="City"
                        requestEditMode={this.onRequestEditMode}
                        isEditing={"city" === this.state.attributeInEdit}
                        {...makeTextValue("city", props.entity.map(e => e.city).orSome(""), x)}
                    />
                    <Attribute
                        id="telephone1"
                        label="Telephone 1"
                        requestEditMode={this.onRequestEditMode}
                        isEditing={"telephone1" === this.state.attributeInEdit}
                        {...makeTextValue("telephone1", props.entity.map(e => e.telephone1).orSome(""), x)}
                    />
                    <Attribute
                        id="stateorprovince"
                        label="State/Province"
                        requestEditMode={this.onRequestEditMode}
                        isEditing={"stateorprovince" === this.state.attributeInEdit}
                        {...makeTextValue("stateorprovince", props.entity.map(e => e.stateorprovince).orSome(""), x)}
                    />
                    <Attribute
                        id="country"
                        label="country"
                        requestEditMode={this.onRequestEditMode}
                        isEditing={"country" === this.state.attributeInEdit}
                        {...makeTextValue("country", props.entity.map(e => e.country).orSome(""), x)}
                    />
                </FocusZone>
            </div>
        )
    }
}

function makeTextValue(aname: string, value: string | null, getControlProps?: () => object): ControlsFactoryResult {
    const display = (props: ControlProps) => (<Label>{value ? value : ""}</Label>)
    const xtraProps = getControlProps ? getControlProps() : {}
    const edit = (props: ControlProps) => (
        <TextField
            {...props}
            id={`${aname}-text-field`}
            data-id={aname}
            value={value ? value : ""}
            {...xtraProps}
        />)
    return {
        id: aname,
        label: aname,
        onRenderEditor: edit,
        onRenderDisplay: display,
    }
}


export type AttributeRenderer<T> = IRenderFunction<ControlProps & { value: T }>

export interface ControlsFactoryResult {
    id: string
    label: string
    onRenderEditor: IRenderFunction<ControlProps>
    onRenderDisplay: IRenderFunction<ControlProps>
}

export type ControlsFactory = (attribute: Meta.Attribute) => ControlsFactoryResult

/**
 * Factory for making controls.
 * @param attribute
 * @param labels
 * @param getControlProps 
 */
function makeControls(attribute: Meta.Attribute, getControlProps?: () => object): ControlsFactoryResult {
    switch (attribute.AttributeType) {
        case "String": {
            const label = Meta.getLabel(attribute.DisplayName)
            const name = label && label.Label ? label.Label : "no label"
            return {
                id: attribute.LogicalName,
                label: name,
                ...makeTextValue(name, "", getControlProps)
            }
        }
        default: {
            throw new Error(`makeControls for attribute type ${attribute.AttributeType} not implemented.`)
        }
    }
}