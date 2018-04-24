import {
    mergeStyles, mergeStyleSets,
} from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"

export interface CustomerAddressesClassNames {
    root: string
    addressSelector: string
    addressDisplay: string
}

export const getClassNames = memoizeFunction((width: number = 100): CustomerAddressesClassNames => {
    return mergeStyleSets(
        {
            root: {},
            addressSelector: {
            },
            label: {
                width
            },
            addressDisplay: {}
        },
    )
})