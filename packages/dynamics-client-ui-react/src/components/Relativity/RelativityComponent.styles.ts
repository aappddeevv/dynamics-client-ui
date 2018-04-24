import { concatStyleSets, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { memoizeFunction } from "office-ui-fabric-react/lib/Utilities"
import { RelativityComponentStyles } from './RelativityComponent.types'

export const getStyles = memoizeFunction((
    customStyles?: RelativityComponentStyles,
    headerHeight: number = 40
): RelativityComponentStyles => {

    const totalHeader = headerHeight + 10
    const styles: RelativityComponentStyles = {
        root: [
            {
                display: "flex",
                flexDirection: "column",
                selectors: {
                    ":global(.rc-tree)": {
                        "height": `calc(100% - ${totalHeader}px)`,
                        "overflowY": "auto",
                    }

                }
            }],
        tree: [
        ]
    }
    return concatStyleSets(styles, customStyles)
})

/*
:root {
    --headerHeight: 40px;
    --extra: 10px;
    --totalHeaderHeight: calc(var(--headerHeight) + var(--extra));
}

:global(.rc-tree) {
    height: calc(100% - var(--totalHeaderHeight));
    overflow-y: auto;
}
*/