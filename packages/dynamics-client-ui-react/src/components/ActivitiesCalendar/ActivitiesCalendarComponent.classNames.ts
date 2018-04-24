import {
    mergeStyles, mergeStyleSets,
} from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"

import {
    ActivitiesCalendarComponentClassNames, ActivitiesCalendarComponentStyles
} from "./ActivitiesCalendarComponent.types"

export const getClassNames = memoizeFunction((
    styles: ActivitiesCalendarComponentStyles,
    className?: string | null
): ActivitiesCalendarComponentClassNames => {
    return mergeStyleSets(
        {
            root: [
                "ttg-ActivitiesCalendarComponent",
                className,
                styles.root,
            ],
            calendar: [
                "ttg-Calendar",
                styles.calendar,
            ],
            controlPanel: [
                "ttg-ControlPanel",
                styles.controlPanel,
            ],
            tab: [
                styles.tab,
            ],
            detailDisplay: [styles.detailDisplay],
            userSelection: [styles.userSelection]
        },
    )
})
