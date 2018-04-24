import * as React from "react"
import cx = require("classnames")
import { DEBUG } from "BuildSettings"
import { ActivityItem, Id } from "./datasources/datamodel"

export interface FooterProps {
    count: number
    selectedIndex: number | null
    selectedActivity: ActivityItem | null
    className?: string | null
}

/** Show the total number of activities. Adjusts the selectedIndex +1. */
export const Footer: React.SFC<FooterProps> = (props) => {
    const prefix = (typeof props.selectedIndex === "number" && props.selectedIndex >= 0) ?
        `${props.selectedIndex + 1} / ` :
        ""
    return (
        <span className={cx(props.className)}>
            {prefix} {props.count} items.
        </span>
    )
}
