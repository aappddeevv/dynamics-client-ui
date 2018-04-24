/** Helpers for working with components, layout, etc. */

import R = require("ramda")

/**
 *  Columns have hierarchical structure.
 * columns: [ index: number(optional), 
 *             props: { className, style: {}},  // apply to headers and cells
 *             cells: { props: { className, style: {  } } // only for cells 
 * ]
 */

/** Combine content in column definitions. */
export const processColumns = (columns: Array<any>): Array<Record<string, any>> => {
    if (!columns) return []
    return columns.map((c, idx) => {
        const style = Object.assign({}, R.path(["props", "style"], c) || {}, R.path(["cells", "props", "style"], c) || {})
        const className = Object.assign({}, R.path(["props", "className"], c) || {}, R.path(["cells", "props", "className"], c) || {})
        return { column: c.index || idx, style, className }
    })
}

// columns: [ index: number(optional), props: { style: {}}, cells: { props: { styles: {}  } }]
export const getColumnStyles = (columns: Array<any>): Record<string, any> => {
    return processColumns(columns).reduce((out, s) => { out[s.column] = s.style; return out }, {})
}

/** Combine classNames info for each column. */
export const getClassNames = (columns: Array<any>) => {
    return processColumns(columns).reduce((out, s) => { out[s.column] = s.className; return out }, {})
}

export const ToolColumn = {
    props: {
        className: ["toolColumn"],
        style: {
            width: "auto"
        }
    }
}

export const addToolColumn = (columns) => columns.push(ToolColumn)

