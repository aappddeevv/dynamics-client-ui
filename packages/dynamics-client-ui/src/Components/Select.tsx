/** Simple <select> with null option. */
import * as React from "react"
const cx = require("classnames")
const styles = require("./Select.css")
import mergeDeepRight from "ramda/es/mergeDeepRight"

/** Options for select. */
export interface Option {
    value: string
    label: string
}

export interface ElProps {
    select?: {
        component?: React.ReactType
        className?: string
        props?: { [pname: string]: any }
    }
    option?: {
        component?: React.ReactType
        className?: string
        props?: { [pname: string]: any }
    }
}

export const DefaultElProps: ElProps = {
    select: {
        component: "select"
    },
    option: {
        component: "option"
    }
}

/** If a NULL is used in the select, this is the explicit value. */
export const NULL_OPTION_VALUE = "NULL"

export interface Props {
    options: Array<Option>
    /** If not set, first option is shown. */
    value?: string
    /** Use this if you want uncontrolled */
    defaultValue?: string
    /** Default is false. */
    addNullOption?: boolean
    /** Takes the value as argument, possible including NULL_OPTION_VALUE */
    onChange: (o: string) => void
    /** Props for the element */
    components?: ElProps
}

export const Select: React.SFC<Props> = (props: Props) => {
    const { options, value } = props
    const addNullOption = props.addNullOption ? props.addNullOption : false
    const onChange = props.onChange ? props.onChange : (v: string) => { }
    const cprops: ElProps = mergeDeepRight(DefaultElProps, props.components || {})
    //console.log("Select", value, options)
    const SelectType = cprops.select!.component!
    const OptionType = cprops.option!.component!
    return (
        <SelectType className={cx(styles.select, cprops.select!.className)}
            value={value}
            onChange={e => onChange(e.target.value)}
            {...cprops.select!.props}>
            {addNullOption ? <option value="NULL" /> : null}
            {
                options.map(o => {
                    return (
                        <OptionType
                            className={cx(styles.option, cprops.option!.className)}
                            key={o.value}
                            value={o.value}
                            {...cprops.option!.props}
                        >
                            {o.label}
                        </OptionType>)
                })
            }
        </SelectType >
    )
}

export default Select
