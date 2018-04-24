/** 
 * Redux reducer ingredients for the core component. 
 * Create your own store from this reducers export.
 */

import search, { STATE_KEY as SEARCH_STATE_KEY, SearchState} from "./search";
import filter, { STATE_KEY as FILTER_STATE_KEY, FilterState} from "./filter";
import view, { STATE_KEY as VIEW_STATE_KEY, ViewState } from "./view";
import data, { STATE_KEY as DATA_STATE_KEY, DataState} from "./data";

export {
    VIEW_STATE_KEY, FILTER_STATE_KEY, SEARCH_STATE_KEY, DATA_STATE_KEY,
    FilterState, SearchState, ViewState, DataState,
}

const reducers = {
    [VIEW_STATE_KEY]: view,
    [FILTER_STATE_KEY]: filter,
    [SEARCH_STATE_KEY]: search,
    [DATA_STATE_KEY]: data
}

export { reducers }

/** Reducers. Use as `combineReducers({...activitiesViewReducers, otherReducers})`
 *  to create a reducer for the redux store.
 */
export default reducers
