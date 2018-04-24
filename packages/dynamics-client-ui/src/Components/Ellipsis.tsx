/** Bound text, show ellipsis. */

import * as React from "react"
const cstyles = require("../Dynamics/common.css")

/**
 * The width 100% seems to fix some cut-offs when the text
 * in the inner div seems to prematurely get ellipsis. This
 * means the parent div needs to have a width constrained 
 * somehow.
 */
export const Ellipsis = ({ children }) => {
    return (
        <div className={cstyles.textOverflowContainer}>
            <div className={cstyles.textOverflowEllipsis} style={{ width: "100%" }}>
                {children}
            </div>
        </div>
    )
}

export default Ellipsis
