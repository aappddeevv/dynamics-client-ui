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
            header: [
                "ttg-AddressEditor-header",
                styles.header,
            ],
            masterDetail: [
                "ttg-AddressEditor-masterDetail",
                styles.masterDetail,
            ],
            master: [
                "ttg-AddressEditor-part",
                "ttg-AddressEditor-master",
                styles.part,
                styles.master,
            ],
            detail: [
                "ttg-AddressEditor-part",
                "ttg-AddresEditor-detail",
                styles.part,
                styles.detail
            ],
        },
    )
})
