import { concatStyleSets, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"
import { AddressEditorStyles } from './AddressEditor.types'

export const getStyles = memoizeFunction((
    customStyles?: AddressEditorStyles,
): AddressEditorStyles => {
    const headers = 40

    const styles: AddressEditorStyles = {
        root: {
            display: "flex",
            flexDirection: "column",
        },
        /** Assumes all parts are on the same row so all have command bar header. */
        part: {
        },
        masterDetail: {
            height: `calc(100% - ${headers}px)`,
            display: "flex",
        },
        master: {
            flexBasis: "50%",
            minWidth: 300,
            marginRight: 20,
            selectors: {
                // the underline is not always consistent on the display
                // "& .ms-List-cell": {
                //     borderBottom: "1px solid rgb(206,206,206)"
                // }
                "& .ttg-SortableDetailsList": { height: "100%" }
            }
        },
        detail: {
            flexBasis: "50%",
            minWidth: 300,
            overflowY: "auto",
        }
    }
    return concatStyleSets(styles, customStyles)
})
