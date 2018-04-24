import {
    mergeStyles, mergeStyleSets,
} from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"

import {
    AddressEditorClassNames, AddressEditorStyles
} from "./AddressEditor.types"

export const getClassNames = memoizeFunction((
    styles: AddressEditorStyles,
    className?: string | null
): AddressEditorClassNames => {
    return mergeStyleSets(
        {
            root: [
                "ttg-AddressEditor",
                className,
                styles.root,
            ],
            masterDetail: [
                "ttg-MasterDetail",
                styles.masterDetail,
            ],
            master: [
                "ttg-AddressList",
                styles.master,
            ],
            detail: [
                "ttg-AddressDetail",
                styles.detail
            ],
        },
    )
})
