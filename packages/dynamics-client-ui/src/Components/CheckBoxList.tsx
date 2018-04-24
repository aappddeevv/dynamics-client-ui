import * as React from "react"
import { defaultProps } from "recompose"
import R = require("ramda")
import { firstOrElse, noop, composeEventHandlers } from "../Dynamics/Utils"

export interface CheckBoxListManagerProps {
    /** Individual checkbox change callback. You can also just use onListChange. */
    onChange?: (value: string, checked: boolean, evt: any) => void
    /** Called with all checked values if a checkbox changes or after the the component mounts. */
    onListChange?: (values: Set<any>) => undefined
}

/**
 * Parent for checkbox list. Only passes enhanced props to and then renders the first child.
 * The only requirement for the child is to receive `getInputProps` and potentially
 * use it to render a checkbox. Children can use `updateList` in getInputProps to contribute
 * to the overall checkbox list reporting from the mangaer.
 *
 * The underyling "checkbox creator" can optionally use `getInputProps` to set the props
 * for the input element and `updateList` to add and remove checked status
 * back to the manager for reporting in `onListChange`.
 */
export class CheckBoxListManager extends React.Component<CheckBoxListManagerProps, {}> {

    constructor(props: CheckBoxListManagerProps) {
        super(props)
    }

    static defaultProps = {
        onChange: noop,
        onListChange: noop
    }

    /** Non-state in the sense it does not drive rendering. */
    private checkedValues = new Set<any>()

    private input_handleOnChange = (e) => {
        this.props.onListChange && this.props.onListChange(this.checkedValues)
    }

    private input_updateList = (key, checked) => checked ?
        this.checkedValues.add(key) : this.checkedValues.delete(key)

    // Factor out type, it's always "checked" for this component.
    private getInputProps = ({ type, onChange, ...rest }) => {
        return {
            role: "checkbox",
            'type': "checkbox",
            onChange: composeEventHandlers(onChange, this.input_handleOnChange),
            updateList: this.input_updateList,
            ...rest,
        }
    }

    private getCombinedProps = () => ({
        getInputProps: this.getInputProps
    })

    render() {
        this.checkedValues.clear()
        const children = firstOrElse<any, any>(this.props.children, noop)
        const element = firstOrElse(children(this.getCombinedProps()), null)
        return element
    }
}

const isNilOr = (v, o) => R.isNil(v) ? o : v;

export interface CheckBoxListProps {
    className?: string | null
    /** Array of {value, label} pairs. Values will be converted to strings. */
    options: Array<any>
    /** Array of values that are checked or a predicate. If checked is undefined, will look for checked property. */
    checked?: Array<string> | ((v: string) => boolean)
    /** Outer react container component */
    Container: React.ReactType
    /** Component for the checkbox.  It will be passed {key,value,label,checked,getInputProps}. */
    CheckBoxComponent: React.ReactType
    /** Individual checkbox change callback. You can also just use onListChange. */
    onChange?: (value: string, checked: boolean, evt: any) => void
    /** Called with all checked values if a checkbox changes or after the the component mounts. */
    onListChange?: (values: Set<any>) => undefined
    /** name, not sure what this is for anymore. */
    name?: string | null
}

/**
 * Default and fairly standard checkbox list implementation. Renders a list of checkboxes from an options list (a strict value).
 * The outer container does not need to know about ChcekBoxListManager. The callback onChange receives
 * convenient properties such as the option item and its checked status as well as the event object. This
 * class takes over the rendering process and makes assumptions about the options data model.
 *
 */
class _CheckBoxList extends React.Component<CheckBoxListProps, {}> {

    constructor(props: any) {
        super(props)
    }

    // make map func an arrow outside of render so the callback func does not force a render
    private makeItem = (opt, idx, checkme, CheckBoxComponent, getInputProps, firstOnChange) => {
        const value = isNilOr(opt.value, `value-${idx}`)
        const label = isNilOr(opt.label, `label-${idx}`)
        const isChecked = checkme(value)
        const cprops = {
            key: value.toString(),
            label: label,
            checked: isChecked,
            value: value,
            option: opt,
            // the only trick we do is to make the onChange API easier to use.
            // so we change the onChange handler from getInputProps().
            getInputProps: ({ onChange, ...p }) => getInputProps({
                ...p,
                //onChange: composeEventHandlers(firstOnChange(value, isChecked), onChange)})}
                onChange: composeEventHandlers(firstOnChange(value, isChecked), onChange)
            })
        }
        //console.log(cprops)
        return (<CheckBoxComponent {...cprops} />)
    }

    render() {
        const {
            options, checked, onListChange, onChange, CheckBoxComponent, Container, ...rest
        } = this.props
        const originalOnChange = onChange
        // When rendering, we already know what is checked or not, so curry onChange handler with that info.
        /* const localOnChange = (value, isChecked, onOneChanged) => onOneChanged ?
         *                                                         R.curry(onOneChanged)(value, !isChecked) : null*/
        const localOnChange = (value, isChecked) => originalOnChange ?
            (evt) => originalOnChange(value, !isChecked, evt) :
            null

        const checkme = (value) => {
            if (Array.isArray(checked)) return checked.includes(value)
            else if (checked && R.is(Function, checked)) return checked(value)
            return false
        }

        return (
            <CheckBoxListManager onChange={onChange} onListChange={onListChange}>
                {({ getInputProps }) => (
                    <Container {...rest} >
                        {options.map((opt, idx) => this.makeItem(opt, idx,
                            checkme,
                            CheckBoxComponent,
                            getInputProps,
                            localOnChange))}
                    </Container>
                )}
            </CheckBoxListManager>
        )
    }
}
//R.curry(localOnChange)(R.__, R.__, originalOnChange)))}

/**
 * A checkbox input element wrapped with a label.
 */
export function CheckBox({ getInputProps, ...rest }) {
    const { key, value, label, checked, option, onChange, updateList, ...iprops } = getInputProps(rest)
    //const { key, value, label, checked, option, updateList, ...iprops } = rest
    const id = value.toString()
    if (checked) updateList(value, checked)
    return (
        <label htmlFor={id}>
            <input id={id}
                name={id}
                style={{ verticalAlign: "middle" }} // argh! need to merge styles here
                checked={checked}
                onChange={onChange}
                {...iprops} />
            {label}
        </label>
    )
}

/** Render items using a flexbox.
 * @param direction "column"|"row", default is column.
 */
export function DefaultContainer(props): JSX.Element {
    const { direction, children } = props;
    return (
        <div style={{ display: "flex", flexDirection: isNilOr(direction, "column") }}>
            {children}
        </div>
    )
}

export const CheckBoxList = defaultProps<CheckBoxListProps>({
    options: [],
    checked: [],
    onChange: (arg: any) => { },
    Container: DefaultContainer,
    CheckBoxComponent: CheckBox
})(_CheckBoxList)
export default CheckBoxList


/** Render items using an HTML ul element. Each checkbox item is wrapped in a li.
 */
export function ListContainer({ children, className, style }) {
    return (
        <ul style={{ margin: 0, padding: 0, listStyleType: "none", ...style }}
            className={className}>
            {children}
        </ul>
    );
}

export function ListCheckBox(props) {
    return (<li><CheckBox {...props} /></li>)
}

export const CheckBoxListUsingList = defaultProps<CheckBoxListProps>({
    options: [],
    checked: [],
    Container: ListContainer,
    CheckBoxComponent: ListCheckBox
})(_CheckBoxList)
