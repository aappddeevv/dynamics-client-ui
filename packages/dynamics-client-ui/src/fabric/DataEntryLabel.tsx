/**
 * A "label" useful on data entry forms. Meant to match UCI visuals.
 */
import * as React from "react"
import { IStyle, mergeStyleSets, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { css } from "office-ui-fabric-react/lib/Utilities"
import { Label } from "office-ui-fabric-react/lib/Label"

export interface DataEntryLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  content?: React.ReactNode
  required?: boolean
  disabled?: boolean
}

export function DataEntryLabel(props: DataEntryLabelProps): JSX.Element {
  return (
    <Label
      disabled={props.disabled}
      required={props.required}
    >
      {props.content ? props.content : null}
    </Label>
  )
}