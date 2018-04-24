import { reducer, STATE_KEY as CAL_STATE_KEY } from "./calendarView"
import { reducers as stdReducers } from "../../ActivitiesReader/redux/reducers"
import {
    VIEW_STATE_KEY, FILTER_STATE_KEY, SEARCH_STATE_KEY, DATA_STATE_KEY,
    SearchState, FilterState, ViewState, DataState
} from "../../ActivitiesReader/redux/reducers"

/**
 * Standard reducers for calendar view. Includes all the standard reducers needed.
 */
const reducers = {
    [CAL_STATE_KEY]: reducer,
    ...stdReducers,
}

export { reducers }
export default reducers
