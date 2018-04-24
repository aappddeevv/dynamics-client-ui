import * as React from "react"
import { Radio, RadioGroup } from "react-radio-group"
import { defaultProps } from "recompose"

export function RadioBoxItem({ value, label, ...rest }) {
    return (
        <div style={{ height: 20 }} {...rest}>
            <label>
                <Radio value={value} />
                {label}
            </label>
        </div>
    )
}

/** Render items vertically using a flexbox . */
export function DefaultComponent({ children, ...rest }): JSX.Element {
    return (
        <div style={{ display: "flex", flexDirection: "column" }} {...rest}>
            {children}
        </div>
    )
}

export function RadioSelect({ options, Component, ...rest }: { options?: Array<any>, [pname: string]: any }) {
    const content = (options || []).map(opt => <RadioBoxItem key={opt.value.toString()} {...opt} />)
    const c = Component || DefaultComponent
    return (
        <RadioGroup Component={c} {...rest}>
            {content}
        </RadioGroup>
    )
}

export default RadioSelect
