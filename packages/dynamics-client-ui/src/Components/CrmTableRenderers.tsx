/** CrmTable renderers for different data types. */

const moment = require("moment")
const R = require("ramda")

export const defaultDateTimeFormat = "MM/DD/YY h:mm:ss a"

/** Props to the renderer factory. */
export interface RendererProps {
    id?: string
    property: string
    label: string
    width?: number
    dateFormat?: string
}

export function dateRenderer(props: RendererProps) {
    return {
        id: props.id ? props.id : props.property,
        property: props.property,
        header: {
            label: props.label
        },
        props: {
            style: {
                minWidth: props.width ? props.width : 100
            }
        },
        cell: {
            formatters: [
                (dt: Date) => dt ? moment(dt).format(props.dateFormat ?
                    props.dateFormat :
                    defaultDateTimeFormat) : ""
            ]
        }
    }
}

/** Data types this factory understands. */
export type DataType = "string" | "date" | "entity"

/** Default used with renderers produced internally by the factory. */
const defaultRendererProps = {
    width: 125
}

/**
 * Based on a string type, obtain a renderer. Props may contain additional hints
 * about which renderer to use. The returned object should be merged with other
 * properties before being used in CrmTable. If you merge, use a deep/smart merge
 * approach as Object.assign only does a toplevel merge.
 */
export function columnFactory(dtype: DataType, props: RendererProps): object {
    const fprops = R.deepMergeRight(defaultRendererProps, props)
    switch (dtype) {
        case "string": {
            return {}
        }
        case "date": {
            return dateRenderer(fprops)
        }
    }
    throw new Error(`Unknown type ${dtype}`)
}
