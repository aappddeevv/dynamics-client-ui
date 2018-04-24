import * as React from "react"
import { Label } from "office-ui-fabric-react/lib/Label"
import { getNativeProps, divProperties, IRenderFunction } from "office-ui-fabric-react/lib/Utilities"

export interface AttributeLabelProps extends Partial<React.AllHTMLAttributes<HTMLDivElement>> {
    label: string
    required?: boolean
    isEditing?: boolean
}

/** Render an attribute label for a form-like presentation. */
export const AttributeLabel: React.SFC<AttributeLabelProps> = (props) => {
    const divprops = getNativeProps(props, divProperties)
    return (
        <Label {...divprops} >
            {props.label}
        </Label>
    )
}