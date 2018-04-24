/**  
 * Header, body for data looking content. Header looks like
 * the header on a Dynamics table but the content can 
 * be anything.
 */

import * as React from "react"
const cx = require("classnames")
const styles = require("../Dynamics/crmpanel.css")

export interface Classes {
    root?: string
    header?: string
    content?: string
}

export interface Props {
    label: string
    classes?: Classes
}

/** Show header and content (children). */
export const CrmDataPanel: React.SFC<Props> = (props) => {
    const cls = props.classes || {}
    return (
        <div className={cx(styles.crmPanel, cls.root)}>
            <div className={cx(styles.panelHeader, cls.header)}>
                {props.label}
            </div>
            <div className={cx(styles.panelContent, cls.content)}>
                {props.children}
            </div>
        </div>

    )
}

export default CrmDataPanel
