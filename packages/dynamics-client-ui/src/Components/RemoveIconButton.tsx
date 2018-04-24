/** 
 * Standard remove button for a line of data being displayed. Has hard-coded styling
 * Clients can keep it invisible until the row is highlighted using the className.
 */

import * as React from "react"
const cx = require("classnames")
const styles = require("./RemoveIconButton.css")

export interface Props {
    /** Curry your onRemove if you want to add parameters to the call. */
    onRemove: () => void
    className?: string
}

export const RemoveIconButton: React.SFC<Props> = ({ onRemove, className }) => {
    return (<input
        type="button"
        alt="Remove"
        title="Remove"
        className={cx(styles.removeIconButton, className)}
        onClick={() => onRemove()}
    />)
}

export default RemoveIconButton
