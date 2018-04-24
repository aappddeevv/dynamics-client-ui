import * as React from "react"
import cx = require("classnames")
import { DEBUG } from "BuildSettings"

/**
 * Render a flex (row) div.
 */
export const ActivitiesBody: React.SFC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
    return (
        <div style={{ display: "flex" }} {...props} >
            {props.children}
        </div>
    )
}
