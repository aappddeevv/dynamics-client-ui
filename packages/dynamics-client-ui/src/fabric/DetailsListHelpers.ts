/** Helpers for managing a DetailsList. */

const R = require("ramda")
import {
    IColumn, ColumnActionsMode
} from 'office-ui-fabric-react/lib/DetailsList'

export const OTHER: string = "OTHER"
export type SortOrder = "asc" | "desc" | "OTHER"
export type SortOrderState = SortOrder | "FIRST"

/** Sorting state for a single column. */
export interface ColumnSortInfo {
    /** Sorting direction. */
    direction: SortOrder
    /** Position in column sorting order e.g. if firstname to be sorted *after* lastname,
     *  pos=1 for firstname and pos=0 for lastname.
     */
    position: number
}

/** Group of individual column sort infos. State key is column index or IColumn.key. */
export type SortingState = {
    [col: number]: ColumnSortInfo
    [col: string]: ColumnSortInfo
}

/** Transition table for sorting direction state machine. */
export interface SortOrderTransitions extends Partial<Record<SortOrder, SortOrder>> {
    /** Starting state is required. */
    FIRST: SortOrder
}

/**
 * Default sort order state machine table. You can also store these as state in
 * in your component and provide them to the byColumns* functions.
 */
export const defaultOrder: SortOrderTransitions = {
    FIRST: "asc",
    OTHER: "asc",
    asc: "desc",
    desc: "OTHER"
}

/**
 * Previous SortingState => new SortingState (state machine). Only allows single
 * column sorting. Cycles through sorting order if its already sorted on that column.
 */
export function byColumn({ current,
    transitions = defaultOrder,
    selectedColumn = -1,
    defaultPosition = 0 }: {
        current: SortingState
        transitions: SortOrderTransitions
        selectedColumn: number | string
        defaultPosition?: number
    }): SortingState {

    if (typeof selectedColumn === "number" && selectedColumn < 0) return current
    let nextState: SortOrder | undefined = transitions.FIRST

    // find if current column is in current state, so we can cycle it
    const maybeCurCol = current[selectedColumn]
    if (maybeCurCol) {
        nextState = transitions[maybeCurCol.direction] // returns next state
        if (!nextState) return {}
    }
    return {
        [selectedColumn]: {
            direction: nextState,
            position: defaultPosition
        }
    }
}

/**
 * Updates a multi column sorting state by updating the selectedColumn.
 * If selectedColumn is new to the sorting state, it is placed last in the
 * positions.
 */
export function byColumns({ current,
    transitions = defaultOrder,
    selectedColumn = -1 }: {
        current: SortingState,
        transitions: SortOrderTransitions,
        selectedColumn: number | string
    }): SortingState {
    // get last position, assume sorting state is "short"
    const max = Math.max(...Object.keys(current ? current : {}).map(k => current[k].position)) + 1
    const alreadyExists = current ? (current[selectedColumn] ? true : false) : false
    let newOrUsed = alreadyExists ?
        byColumn({ current, transitions, selectedColumn, defaultPosition: current[selectedColumn].position }) :
        byColumn({ current, transitions, selectedColumn, defaultPosition: max })
    return Object.assign({}, current, newOrUsed)
}

/** Sort data. */
export type Sorter<T> = (a: Array<T>) => Array<T>

/** Create Sorter functions given sorting information. */
export type SortFunctionFactory<T> = (info: Array<{ property: string, direction: SortOrder }>) => Sorter<T>

/** Get the property name of the data accessor to access the data used for sorting from an IColumn. */
function getSortAttribute(c: IColumn): string {
    if (c.data && c.data.sortAttribute) return c.data.sortAttribute
    else return c.fieldName
}

/**
 * Create a Sorter given columns, sorting state and a sort function factory.
 * Uses IColumn.key to lookup fieldname|data.sortAttribute if sorting state has a property name as a key,
 * or IColumn[index] to lookup the column. If the sorting state has a state that is not a column, it is skipped.
 */
export const sorter = <T>({ columns,
    state,
    factory = ramdaSortFunctionFactory }:
    {
        columns: Array<IColumn>
        factory?: SortFunctionFactory<T>
        state: SortingState
    }): Sorter<T> => {
    // flatten sorting state
    const x = Object.keys(state).map(k => {
        const sortInfo = state[k]
        const index = (typeof k === "number") ?
            columns[k] :
            columns.find(c => c.key === k)
        if (!index) return null
        let p: string = getSortAttribute(index)
        return {
            property: p,
            direction: sortInfo.direction,
            order: sortInfo.position,
        }
    }).filter(x => !!x)
    return factory ?
        factory(R.sort(i => i.order, x)) :
        ramdaSortFunctionFactory(R.sort(i => i.order, x))
}

/** Sort function factory that uses ramda sortWith. */
export function ramdaSortFunctionFactory<T>(info: Array<{
    property: string,
    direction: SortOrder
}>): Sorter<T> {

    const comparators = info.filter(i => i.direction !== OTHER).
        map(i => {
            if (i.direction === "asc") return R.ascend(R.prop(i.property))
            else return R.descend(R.prop(i.property))
        })
    return (comparators.length === 0 ?
        R.identity :
        R.sortWith(comparators)) as Sorter<T>
}

/**
 * Update column definitions based on the column key and the map of updates.
 * This really just does a R.mergeRight but by column field.
 */
export function updateColumns(columns: IColumn[],
    updates: { [key: string]: Partial<IColumn> }): IColumn[] {
    return columns.map(c => {
        const update = { ...c, ...updates[c.key] }
        return update
    })
}

/**
 * Enhance a list of column-like information based on the sortState. All columns are
 * are sortable unless data.isSortable = false.
 * You can set a DetailsList.onColumnHeaderClick instead of passing in onSortColumn.
 */
export function augmentColumns(cols: any[], sortState: SortingState,
    onSortColumn?: (c: IColumn) => void,
    getMoreProps?: (c: IColumn, idx: number) => Record<string, any>): IColumn[] {
    return cols.map((c, idx) => {
        if (c.data && typeof c.data.isSortable === "boolean" && !c.data.isSortable)
            return { ...c }

        const sortInfo: ColumnSortInfo | undefined = sortState[c.key]
        const isSorted = sortInfo ? (sortInfo.direction !== OTHER) : undefined
        const isSortedDescending = isSorted ?
            (sortInfo.direction === "desc" ? true : false) : undefined
        const moreProps = getMoreProps ? getMoreProps(c, idx) : {}
        const onCC = onSortColumn ?
            { onColumnClick: (x, col) => { if (col) onSortColumn(col) } } :
            {}
        return {
            ...c,
            ...moreProps,
            isSorted,
            isSortedDescending,
            ...onCC,
        }
    })
}

/**
 * Given a request to sort, update critical key parts of the sorting infrastructure.
 * You will need to sort your data with the returned sorter function. The returned
 * columns are updated with the new sort state (e.g. isSorted, isSortedDescending).
 */
export function onSortColumn<T>(c: IColumn, columns: IColumn[],
    sortState: SortingState,
    transitions: SortOrderTransitions,
    factory: SortFunctionFactory<T> = ramdaSortFunctionFactory) {
    // create the new sort state
    const state = byColumns({
        current: sortState,
        transitions,
        selectedColumn: c.key,
    })

    // augment the columns with the new sort state
    const newColumns = augmentColumns(columns, state)

    // create the new sorter function
    const newSorter = sorter<T>({
        columns: newColumns,
        state,
        factory,
    })

    return {
        columns: newColumns,
        sortState: state,
        sorter: newSorter,
    }
}

/**
 * Given a list of columns filter them on a function. If no columns pass through the filter,
 * return the original columns so you show at least something.
 *
 */
export function filterOrAll<C extends { key: string }>(columns: Array<C>, filter: (key: string) => boolean): Array<C> {
    const filtered = columns.filter(c => filter(c.key))
    if (filtered.length === 0) return columns
    else return filtered
}

/** Given a list of values, create a predicate function for `filterOrAll`. */
export function mkFilterFromValues(values: Array<string>): (value: string) => boolean {
    return (value: string) => values.includes(value)
}