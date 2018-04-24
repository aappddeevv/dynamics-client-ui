import { concatStyleSets, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"
import { ActivitiesCalendarComponentStyles } from './ActivitiesCalendarComponent.types'

export const getStyles = memoizeFunction((
    customStyles?: ActivitiesCalendarComponentStyles,
): ActivitiesCalendarComponentStyles => {
    const headers1 = 42
    const headers2 = 40
    const headers = headers1 + headers2

    const styles: ActivitiesCalendarComponentStyles = {
        root: {
            display: "flex",
            font: "inherit",
            //fontSize: 12, // is this necessary?
        },
        calendar: {
            flexBasis: "80%",
            paddingRight: 20,
            overflow: "hidden",
            fontSize: 12,
        },
        controlPanel: {
            display: "flex",
            flexDirection: "column",
            flexBasis: "20%",
            minWidth: 300
        },
        tab: {
            paddingTop: 20,
            height: `calc(100% - ${headers}px)`,
        },
        detailDisplay: {
        },
        userSelection: {
        }
    }
    return concatStyleSets(styles, customStyles)
})
