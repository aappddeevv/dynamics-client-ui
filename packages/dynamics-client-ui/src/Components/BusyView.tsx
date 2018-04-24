/*
 * Busy view with spinning thing and a message. Designed for showing a spinner
 * in place of data while a fetch/processing in progress.
 */
import * as React from "react"
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner'

export interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    /* Something renderable like a string or an element. Children are rendered below the message. */
    message?: React.ReactNode
    /* Spinner size, defaults to large. */
    size?: SpinnerSize
}

const defaultStyle = {
    display: "flex",
    flexDirection: "column",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
}

/** Vertically and horizontally center the content spinner and message. */
export function BusyView(props: Props): JSX.Element {
    let { message, size, style, ...rest } = props
    style = Object.assign({}, defaultStyle, style)
    return (
        <div
            style={style}
            {...rest}
        >
            <Spinner size={size ? size : SpinnerSize.large} />
            {message ?
                <div style={{ marginTop: 20 }}>
                    {message ? message : null}
                </div> : null
            }
            {props.children}
        </div>
    )
}

export default BusyView
