import React from "react"
import { defaultProps } from "recompose"
import R from "ramda"
import { firstOrElse, noop, composeEventHandlers } from "../Dynamics/Utils"

/** 
 * Simple react list.
 */
class ListManager extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            onListChange: props.onListChange
        }
    }

    static defaultProps = {
        onChange: noop,
        onListChange: noop
    }

    /** Non-state in the sense it does not drive rendering. */
    checkedValues = new Set()

    input_handleOnChange = (e) => {
        this.state.onListChange(this.checkedValues)
    }

    input_updateList = (key, checked) => checked? this.checkedValues.add(key) : this.checkedValues.remove(key)

    // Factor out type, it's always "checked" for this component.
    getItemProps = ({type, onChange, ...rest} = {}) => {
        return {
            onChange: composeEventHandlers(onChange, this.input_handleOnChange),
            updateList: this.input_updateList,
            ...rest,
        }
    }

    getCombinedProps = () => ({
            getItemProps: this.getInputProps
        })

    render() {
        this.checkedValues.clear()
        const children = firstOrElse(this.props.children, noop)
        const element = firstOrElse(children(this.getCombinedProps()))
        if(!element) return null
        return element
    }
}

const isNilOr = (v, o) => R.isNil(v) ? o : v;

/** 
 * Default and fairly standard checkbox list implementation. Renders a list of checkboxes from an options list (a strict value).
 * The outer container does not need to know about ChcekBoxListManager. The callback onChange receives
 * convenient properties such as the option item and its checked status as well as the event object. This
 * class takes over the rendering process and makes assumptions about the options data model.
 *
 * @param options Array of {value,label} pairs. Value will be converted to a string.
 * @param checked Array|function of values representing checked status or a function taking a value and returning
 *   boolean (true if checked) . If checked is undefined it will look for "checked" property on each option element.
 * @param {(value, checked, evt) => undefined } onChange Optional. Individual checkbox change callback. You can use 
 *   onListChange instead of this.
 * @parma {(Set of values) => undefined} onListChange Called with all checked values if a checkbox changes or after the
 *   the component mounts.
 * @param Container Outer react container Component.
 * @param CheckBoxComponent Your own checkbox component. It will be passed {key,value,label,checked,getInputProps}.
 */
class _List extends React.Component {

    // make map func an arrow outside of render so the callback func does not force a render
    makeItem = (opt, idx, checkme, ItemComponent, getInputProps, firstOnChange) => {
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
            getInputProps: ({onChange, ...p}) => getInputProps({
                ...p,
                //onChange: composeEventHandlers(firstOnChange(value, isChecked), onChange)})}
                onChange: composeEventHandlers(firstOnChange(value, isChecked), onChange)})}
        //console.log(cprops)
        return(<ItemComponent key={value} {...cprops} />)
    }
    
    render() {
        const {options, checked, onListChange, onChange, ItemComponent, Container, ...rest} = this.props
        const originalOnChange = onChange
        // When rendering, we already know what is checked or not, so curry onChange handler with that info.
        /* const localOnChange = (value, isChecked, onOneChanged) => onOneChanged ?
         *                                                         R.curry(onOneChanged)(value, !isChecked) : null*/
        const localOnChange = (value, isChecked) => originalOnChange ?
                                                  (evt) => originalOnChange(value, !isChecked, evt):
                                                  null
        const checkme = (value) => {
            if(R.is(Array, checked)) return checked.includes(value);
            else if(R.is(Function, checked)) return checked(value);
            return false;
        }
        
        return(
            <ListManager onChange={onChange} onListChange={onListChange}> 
                { ({getItemProps}) => (
                    <Container {...rest} >
                      { options.map((opt, idx) => this.makeItem(opt, idx,
                                                                checkme,
                                                                ItemComponent,
                                                                getInputProps,
                                                                localOnChange))}
                    </Container>
                )}
            </ListManager>
        )
    }
}

export function Item({getInputProps, children, ...rest}) {
    const { key, value, label, checked, option, onChange, updateList, ...iprops } = getInputProps(rest)
    const id  = value.toString()
    if(checked) updateList(value, checked)
    return(
        <li id={id} onClick={onChange}>
            { label ? label : children}
        </li>
    )
}

export function ListContainer({children, className, style}) {
    return(
        <ul style={{ margin:0, padding:0, listStyleType:"none", ...style }}
            className={className}>
            {children}
        </ul>
    );
}

export const List = defaultProps({ options: [], checked:[],
                                   Container: ListContainer,
                                   CheckBoxComponent: Item})(_List)

export default List
