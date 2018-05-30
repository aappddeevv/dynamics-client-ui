/**
 * Sortable details list using helpers.
 */
import * as React from "react"
import { Fabric } from "office-ui-fabric-react/lib/Fabric"
import {
    css, IRenderFunction, memoizeFunction,
} from "office-ui-fabric-react/lib/Utilities"
import { mergeStyles, mergeStyleSets, IStyle, concatStyleSets } from "office-ui-fabric-react/lib/Styling"
import {
    CheckboxVisibility,
    ColumnActionsMode,
    ConstrainMode,
    DetailsList,
    IDetailsList,
    IDetailsListProps,
    DetailsListLayoutMode as LayoutMode,
    IColumn,
    IGroup,
    ISelection,
    Selection,
    SelectionMode,
    IDetailsHeaderProps,
} from "office-ui-fabric-react/lib/DetailsList"
import { ScrollablePane } from "office-ui-fabric-react/lib/ScrollablePane"
import { Sticky, StickyPositionType } from "office-ui-fabric-react/lib/Sticky"
// remove when #4099 is pushed to a release
//import { Sticky } from "./StickyX"
import * as Helpers from "./DetailsListHelpers"
import { setStatePromise } from "../react/component"
import { getColumnStyles } from '../Components/Helpers';

export {
    SortingState, ColumnSortInfo, SortOrderTransitions, defaultOrder,
    SortOrder, SortOrderState, OTHER,
} from "./DetailsListHelpers"

/**
 * Props for SortableDetailsList.
 * @deprecated Use`SortableDetailsListProps`.
 */
export interface Props<T> {
    /** className on root element. */
    className?: string
    /** Selection. This is *not* updated via setItems upon sort. See onSort. */
    selection?: ISelection
    allowSelection?: boolean
    items: T[]
    detailsListProps?: Partial<IDetailsListProps>
    /** These columns override any specified in detailsListProps. */
    columns: Array<Partial<IColumn>>
    /** Default sorting state */
    defaultSortState?: Helpers.SortingState
    /** Callback when sort state changes. */
    onSortStateChanged?: (s: Helpers.SortingState) => void
    /**
     * Callback when this component sorts the items.
     * You may need to update the selection object (setItems) if you maintain your own selection
     * object.
     */
    onSort?: (items: Array<T>) => void

    /** styles for different parts */
    styles?: SortableDetailsListStyles
}

/** The real interface. */
export interface SortableDetailsListProps<T> extends Props<T> { }

export interface State<T> {
    /** Sorting state. */
    sortState: Helpers.SortingState
    /** Function that can be used to sort items to create sorted. */
    sorter: Helpers.Sorter<T>
    /** Item cache to detect changes. */
    items: T[]
    /** Sorted items, based on items. */
    sorted: T[]
    /** Column cache to detect changes. */
    origColumns: Partial<IColumn>[]
    /** Current augmented columns */
    columns: IColumn[]
}

/**
 * Maintains sorting state and sort data when requested. Columns can be augmented with
 * `data.sortAttribute` to specify the attribute to sort on otherwise it defaults
 * to `fieldName.` `data.isSortable=true/false` indicates whether a column can
 * be sorted on. defaultSortState can hold the initial sort state to provide e.g.
 * `{ column1Key: { position: 0, direction: "asc"}}` indicates that column 1 (indicated
 * by the key column1Key), should be sorted first in ascending order. position indicates the
 * order/priority of the column sorts since you can sort on more than one column. A lower
 * position means that column is sorted before other columns with a lower position.
 * `data.sortAttribute` should indicate the attribute to sort on if its different than
 * fieldname.
 *
 * A ScrollablePane is wrapped in an outer div with className ttg-SortableDetailsList.
 * Set the height explictly (e.g. 100%) or ensure its parent has its heigh set e.g. flexbox. The
 * outer div has position "relative" to ensure it forces a scrolle. There is a bug
 * in sticky headers. See the link below. The headers will scroll with the data until
 * this is fixed.
 *
 * @see https://github.com/OfficeDev/office-ui-fabric-react/issues/3267
 */
export class SortableDetailsList<T> extends React.Component<Props<T>, State<T>> {

    constructor(props: Props<T>) {
        super(props)
        const iss = props.defaultSortState || {}
        const columns = Helpers.augmentColumns(props.columns, iss, this.onSortColumn)
        const sorter = Helpers.sorter<T>({
            columns,
            state: iss,
        })
        const items = props.items || []
        const sorted = sorter(items)
        this.onSort(sorted)
        this.state = {
            columns,
            origColumns: props.columns,
            sortState: iss,
            sorter,
            items,
            sorted,
        }
    }

    protected onSort = (items: Array<T>): void => {
        if (this.props.onSort) this.props.onSort(items)
    }

    get sortState(): Helpers.SortingState { return this.state.sortState }

    protected onSortColumn = (col: IColumn) => {
        const somestate = Helpers.onSortColumn<T>(col, this.state.columns, this.state.sortState, Helpers.defaultOrder)
        const sorted = somestate.sorter(this.state.items)
        this.onSort(sorted)
        this.setState({
            ...somestate,
            sorted,
        }, () => {
            if (this.props.onSortStateChanged)
                this.props.onSortStateChanged(somestate.sortState)
        })
    }

    protected updateSortState = (props: Props<T>): void => {
        const columns = Helpers.augmentColumns(props.columns, this.state.sortState, this.onSortColumn)
        const sorter = Helpers.sorter<T>({
            columns,
            state: this.state.sortState,
        })
        const sorted = this.state.sorter(props.items)
        this.setState({
            columns,
            origColumns: props.columns as Array<IColumn>,
            sorted,
            items: props.items,
        }, () => this.onSort(sorted))
    }

    public componentWillReceiveProps(nextProps) {
        if (nextProps.items !== this.state.items ||
            nextProps.columns !== this.state.origColumns) {
            this.updateSortState(nextProps)
        }
    }

    public render() {
        const { className, styles } = this.props
        const cn = getClassNames(getStyles(styles), className)

        const props = this.props
        const selection = props.selection ?
            { selection: props.selection } :
            {}

        return (
            <div className={cn.root}>
                <ScrollablePane
                    className={cn.scrollablePane}
                >
                    <DetailsList
                        // we can leave this off now
                        //onShouldVirtualize={() => false} // hack due to render error #4204
                        // onRenderDetailsHeader={
                        //     // tslint:disable-next-line:jsx-no-lambda
                        //     (props: IDetailsHeaderProps, renderer: IRenderFunction<IDetailsHeaderProps>) =>
                        //         <Sticky stickyPosition={StickyPositionType.Header}>{renderer(props)}</Sticky>
                        // }
                        columns={this.state.columns}
                        items={this.state.sorted}
                        compact
                        selectionPreservedOnEmptyClick
                        selectionMode={props.allowSelection ? SelectionMode.multiple : SelectionMode.none}
                        layoutMode={LayoutMode.justified}
                        constrainMode={ConstrainMode.horizontalConstrained}
                        checkboxVisibility={props.allowSelection ? CheckboxVisibility.onHover :
                            CheckboxVisibility.hidden}
                        {...props.detailsListProps}
                        {...selection}
                        className={css(cn.list, props.detailsListProps ? props.detailsListProps.className : null)}
                    />
                </ScrollablePane >
            </div>
        )
    }
}

export default SortableDetailsList

export interface SortableDetailsListStyles {
    root?: IStyle
    scrollablePane?: IStyle
    list?: IStyle
}

export const getStyles = memoizeFunction((customStyles?: SortableDetailsListStyles): SortableDetailsListStyles => {
    const styles: SortableDetailsListStyles = {
        root: {
            position: "relative",
            // always ensures something is rendered.
            minHeight: 1,
        },
        scrollablePane: {
        },
        list: {
        }
    }
    return concatStyleSets(styles, customStyles)
})

export interface SortableDetailsListClassNames {
    root: string
    scrollablePane: string
    list: string
}

export const getClassNames = memoizeFunction((styles: SortableDetailsListStyles, className?: string | null):
    SortableDetailsListClassNames => {
    return mergeStyleSets({
        root: [
            "ttg-SortableDetailsList",
            "sortableDetailsList",
            "sortedDetailsList",
            styles.root,
            className,
        ],
        scrollablePane: [styles.scrollablePane],
        list: [styles.list],
    })
})