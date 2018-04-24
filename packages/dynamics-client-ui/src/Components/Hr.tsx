// Copied from: https://github.com/Riglerr/react-native-hr/blob/master/src/index.js

import * as React from "react"
const R = require("ramda")

export interface Styles {
    root?: Record<string, any>
    line?: Record<string, any>
    text?: Record<string, any>
}

export const defaultStyles: Styles = {
    line: {
        flex: "auto",
        height: 1,
        backgroundColor: 'black'
    },
    text: {
        display: "inline-block",
        flex: "none",
        textAlign: 'center',
        marginLeft: 15,
        marginRight: 15,
    },
    root: {
        display: "flex",
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        marginRight: 8
    }
}

export interface Props {
    styles?: Styles
    text?: React.ReactNode
}

const renderLine = (key: string, props?: Record<string, any>) =>
    (<div key={key} style={props} />)

const renderText = (key: string, text: React.ReactNode,
                    props?: Record<string, any>) => (
    <div key={key} style={props} >
        <span>{text}</span>
    </div>
)

/**
 * Use textStyle.order: -1 to shift label to left and then you may want 
 * to adjust margins.
 */
export const Hr: React.SFC<Props> = (props: Props) => {
    const s = R.mergeDeepRight(defaultStyles, props.styles ? props.styles : {})
    return (
        <div style={s.root}>
            { props.text ?
              [
                  renderLine("1", s.line),
                  renderText("2", props.text, s.text!),
                  renderLine("3", s.line)
              ]:
              renderLine("1", s.line)
            }
        </div>
    )
}

export default Hr
