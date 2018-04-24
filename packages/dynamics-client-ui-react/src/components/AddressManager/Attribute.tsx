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
import { ConsoleErrorHandler } from "../../../../dynamics-client-ui/lib/Dynamics/ErrorHandler"
import { AttributeLabel, AttributeLabelProps } from "./AttributeLabel"

export interface AttributeClassNames {
    root: string
    label: string
    /** Control, in either edit or display state. */
    control: string
    /** control + edit = edit mode */
    edit: string
    /** control + display = display mode (non-edit) */
    display: string
}

export interface AttributeStyles {
    root?: IStyle
    label?: IStyle
    control?: IStyle
    edit?: IStyle
    display?: IStyle
}

export const getStyles = memoizeFunction((
    customStyles?: AttributeStyles
): AttributeStyles => {
    const styles: AttributeStyles = {
        root: {
            display: "flex", // horizontal
            minHeight: 49,
            border: 0,
            margin: 0,
            padding: 0,
            paddingBottom: "0.5em",
            paddingTop: "0.5em",
            borderBottom: "1px solid rgb(216,216,216)",
        },
        label: {
            minWidth: 150,
            flex: "none",
            display: "flex"
        },
        control: {
            flex: "1 1 auto",
            lineHeight: "2.5em",
            paddingRight: "0.5em",
            paddingLeft: "0.5em",
        },
        edit: {
            fontWeight: "normal"
        },
        display: {
            fontWeight: "600"
        }
    }
    return concatStyleSets(styles, customStyles)
})

export const getClassNames = memoizeFunction((
    customStyles: AttributeStyles
): AttributeClassNames => {
    return mergeStyleSets({
        root: [
            "ttg-FormAttribute",
            customStyles.root,
        ],
        label: [
            "ttg-FormAttributeLabel",
            customStyles.label,
        ],
        control: [
            "ttg-FormAttributeControl",
            customStyles.control,
        ],
        edit: [
            customStyles.edit
        ],
        display: [
            customStyles.display
        ],
    })
})

/**
 * Props you get when rendering a control, either an editor or normal.
 */
export interface ControlProps {
    /** id of control */
    id: string
    /** data-id, should be placed where???, should be on  */
    "data-id": string
    /** Classname. */
    className?: string
}

export interface AttributeProps {
    id: string
    label: string
    styles?: AttributeStyles
    isEditing?: boolean
    requestEditMode?: (id: string) => void

    onRenderLabel?: IRenderFunction<AttributeLabelProps>
    onRenderEditor: IRenderFunction<ControlProps>
    onRenderDisplay: IRenderFunction<ControlProps>
}

export interface AttributeState {
    isEditing: boolean
}

/**
 * Render an attribute, label and control. Manage a small amount of state and change
 * some events into semantic events/callbacks.
 */
export class Attribute extends React.Component<AttributeProps, AttributeState> {
    constructor(props) {
        super(props)
        this.state = {
            isEditing: props.isEditing || false
        }
    }

    protected onRenderLabel = (props: AttributeLabelProps) => {
        return (<AttributeLabel {...props} />)
    }

    public render() {
        const props = this.props
        const styles = getStyles(props.styles)
        const cn = getClassNames(styles)
        const controlId = `${props.id}-control`

        const labelProps = {
            id: `${props.id}-label`,
            label: props.label,
            className: cn.label,
            isEditing: props.isEditing
        }

        const controlProps = (xtra: string) => ({
            id: controlId,
            "data-id": controlId,
            className: css(cn.control, xtra),
        })

        return (
            <div
                id={props.id}
                className={cn.root}
                onClick={() => {
                    console.log("click to edit")
                    props.requestEditMode ? props.requestEditMode(props.id) : null
                }}
            >
                <div style={{
                    border: 0,
                    padding: 0,
                    margin: 0,
                    marginRight: "0.25em",
                    marginLeft: "0.25em",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <label style={{
                        height: "1rem",
                        width: "1rem",
                        textAlign: "center",
                    }}
                    >
                    </label>
                </div>
                {
                    this.props.onRenderLabel ?
                        this.props.onRenderLabel(labelProps, this.onRenderLabel) :
                        this.onRenderLabel(labelProps)
                }
                {props.isEditing && !!props.isEditing ?
                    this.props.onRenderEditor(controlProps(cn.edit)) :
                    this.props.onRenderDisplay(controlProps(cn.display))
                }
            </div>
        )
    }
}