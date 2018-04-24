/**
 * Selectors operating on the filter slice.
 */
import { createSelector } from "reselect"

export {
    selectData,
    selectDataSources,
    selectEnhancers,
    selectFetchStatus,
    selectEntities,
} from "./data"

export {
    selectFilter,
    selectedOwners,
} from "./filter"

export {
    selectSearch,
} from "./search"

export {
    selectedIds,
    selectedIndices,
    selectedEntities,
    selectView,
} from "./view"

export const typesSelector = filter => filter.types

export const selectedTypesSelector = filter => filter.selectedTypes

/**
 * @return {boolean} True if all activity types are selected.
 */
export const allActivityTypesSelected = createSelector(
    [typesSelector, selectedTypesSelector],
    (all, selected) => {
        return all.length === selected.length
    })

export const searchSelector = state => state.search

export const emptySearch = createSelector(
    [searchSelector],
    (text) => {
        return text && text.length === 0
    })
