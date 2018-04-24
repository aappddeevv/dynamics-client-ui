/** 
 * Draws a horizontal line, no text, very simple.
 * Pure presentational component. Line is drawn using
 * the border. Pass in style props to modify style.
 */

import * as React from "react"
const cx = require("classnames")
const styles = require("../Dynamics/common.css")

export interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
}

/* Presentation component. */
export function VerticalSeparator({ className, style, ...rest }: Props): JSX.Element | null {
    const s = Object.assign({}, { height: 1 }, style ? style : {})
    return (
        <div
            className={cx(styles.bottomLineSeparator, "verticalSeparator", className)}
            style={s}
        />
    )
}

export default VerticalSeparator
