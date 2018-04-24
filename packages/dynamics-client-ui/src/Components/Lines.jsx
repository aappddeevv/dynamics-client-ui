/**
 * Presentational component that lays out children vertically and ensures that
 * content is truncated so no text wrapping internally occurs. Expands to fill 
 * all space.
 */

import React from "react"
import styles from "../Dynamics/common.css"

export const Lines = ({children})  => {
    return (
        <table style={{font: "inherit",
                       width: "100%",
                       borderSpacing:0,
                       borderCollapse:"collapse",
                       tableLayout:"fixed"}}>
            <tbody>
                { React.Children.map(children, (c, idx) => 
                    <tr key={idx}>
                        <td style={{width:"100%", whiteSpace: "nowrap"}}>
                            <span className={styles.textOverflowContainer}>
                                <span className={styles.textOverflowEllipsis}>
                                    {c}
                                </span>
                            </span>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}

export default Lines
