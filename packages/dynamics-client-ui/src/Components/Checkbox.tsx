/** Very plain checkbox. */

import * as React from "react"
import cx = require("classnames")

export interface Props {
    className?: string
    labelBefore?: boolean
    onChange?: (checked: boolean, id: string, e: any) => void
    label: string
    title?: string
    id?: string
    [propName: string]: any
    checked?: boolean
}

/** 
 * On change takes (checked status, id, evt).
 */
export const Checkbox: React.SFC<Props> = (props) => {
    const { className, labelBefore, onChange, checked, label, ...rest } = props
    const id: string = props.id || label
    const title: string = props.title || label

    const before = (labelBefore) ? <label htmlFor={id}>{label}</label> : null
    const after = (!labelBefore) ? <label htmlFor={id}>{label}</label> : null

    return (
        <div className={cx(className)}
            style={{ verticalAlign: "middle" }}
            title={title} >
            {before}
            <input id={id}
                type="checkbox"
                style={{ verticalAlign: "middle" }}
                checked={checked}
                onChange={e => {
                    if (onChange) onChange(e.target.checked, id, e)
                }}
            />
            {after}
        </div>
    )
}

export default Checkbox
