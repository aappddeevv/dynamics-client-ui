/** HOC to cache a props value and pass a transformed value to the child.
 * When the input value changes, transform it and pass it along. If no
 * transform is specified, then pass it through directly. All other props
 * are passed through. Transforms are asynchronous. Essentially, this allows
 * you to cache some data as state passed through props but is expensive to obtain.
 */

import * as React from "react"

export interface Prop<I, O> {
    /** Data that when changed should trigger a fetch. */
    value?: I | null

    /** Transform the data. */
    transform?: (value: I) => Promise<O>
    
    /** Data is added to the props of child using childProp name. */
    propName?: string

    /** Provide a default value if value is empty. Typically () => ""|0|{}. */
    emptyValue?: () => O

    /** Initial value. */
    initialValue?: I
}

export interface State<I,O> {
    value?: I
    loading: boolean
    error?: Error
}

export class FetchDataComponent<I,O> extends React.Component<Prop<I,O>, State<I,O>> {

    constructor(props, context) {
        super(props, context)
        this.state = {
            value: this.props.initialValue,
            loading: false
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const s = nextProps.value !== this.state.value
        console.log("shouldupdate", nextProps, nextState, s)
        return s
    }
    
    componentWillReceiveProps(nextProps) {
        console.log("receive new props", nextProps)
    }

    //static propTypes = {
    //    children: React.PropTypes.func.isRequired,
    //}
    
    render() {
        const {
            initialValue,
            ...passThrough
        } = this.props
        
        if(this.props.children && React.Children.count(this.props.children)===1) {
            const child = React.Children.only(this.props.children)
            return React.cloneElement(child, {
                ...passThrough
            })
        }
        else return null
    }
}
