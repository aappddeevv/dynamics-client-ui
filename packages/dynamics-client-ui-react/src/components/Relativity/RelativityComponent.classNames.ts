import {
    mergeStyles, mergeStyleSets,
} from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"
import {
    RelativityComponentStyles,
    RelativityComponentClassNames,
} from "./RelativityComponent.types"

export const getClassNames =
    memoizeFunction((
        customStyles: RelativityComponentStyles,
        className?: string | null
    ): RelativityComponentClassNames => {
        return mergeStyleSets(
            {
                root: [
                    "ttg-RelativityComponent",
                    customStyles.root,
                    className,
                ],
                tree: [
                    customStyles.tree
                ]
            },
        )
    })