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
        tab: {
            height: `calc(100% - ${headers}px)`,
        },
        masterDetail: {
            display: "flex", // row
            //flexWrap: "wrap",            
        },
        master: {
            flexBasis: "50%",
            minWidth: 300,
            marginRight: 20,
            selectors: {
                "& .ms-List-cell": {
                    borderBottom: "1px solid rgb(206,206,206)"
                }
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
