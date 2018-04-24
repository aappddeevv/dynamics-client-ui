/** Simple list with click/doubleClick and single selection. */

import * as React from "react"
const cx = require("classnames")
import Ellipsis from "./Ellipsis"
const styles = require("./CrmList.css")
import { Id } from "../Data"

export interface Classes {
    /** Attaches to the outer container list component, ul. */
    list?: string
    /** For a selected item. */
    selected?: string
    /** For each item, li. */
    item?: string
}

export interface Item {
    id: string
    title?: string // use label if title is missing
    label: string
}

export interface Props {
    items?: Array<Item>
    onClick?: (id: string) => void
    onDoubleClick?: (id: string) => void
    selectedId: string | null | undefined
    classes?: Classes
}

/** 
 * Presentational component for displaying a list. Single selection only.
 **/
export const CrmList: React.SFC<Props> = (props) => {

    const onClick = (id: Id) => () => props.onClick ? props.onClick(id) : null
    const onDoubleClick = (id: Id) => () => props.onDoubleClick ? props.onDoubleClick(id) : null
    const items = props.items || []
    const classes = props.classes || {}

    return (
        <ul className={cx(styles.crmList, classes.list)}>
            {
                items.map(i => {
                    const idCheck = props.selectedId === i.id
                    const selected = [
                        { [styles.selected]: idCheck },
                        classes.selected ? { [classes.selected]: idCheck } : null
                    ]
                    const title = i.title || i.label
                    return (
                        <li key={i.id}
                            id={i.id}
                            className={cx(selected, classes.item)}
                            title={title}
                            onClick={onClick(i.id)}
                            onDoubleClick={onDoubleClick(i.id)}>
                            <Ellipsis>
                                {i.label}
                            </Ellipsis>
                        </li>
                    )
                })
            }
        </ul>
    )
}

export default CrmList
