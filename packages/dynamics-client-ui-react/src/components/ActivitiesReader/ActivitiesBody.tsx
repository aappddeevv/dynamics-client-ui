import * as React from "react"
import { DEBUG } from "BuildSettings"

/**
 * Render a flex (row) div. This is the default master detail renderer for the main view.
 */
export const ActivitiesBody: React.SFC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
    return (
        <div style={{ display: "flex" }} {...props} >
            {props.children}
        </div>
    )
}
