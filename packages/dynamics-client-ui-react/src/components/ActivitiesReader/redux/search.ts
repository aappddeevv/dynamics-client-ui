/** Redux search state management. */

import { ActionCreator, Action } from "redux"
import { mkSubactionSaga } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/actionutils"
import {
    actionChannel, select, take, put,
    ActionChannelEffect, PutEffect, SelectEffect, TakeEffect,
} from "redux-saga/effects"
import { selectData, Actions as DataActions } from "./data"
const lunr = require("lunr")
const R = require("ramda")
import { DEBUG } from "BuildSettings"

export const STATE_KEY = "search";

export const defaultSearchAttributes = [
    "subject",
    "description",
    "owner",
    "typecodestr",
]

export interface SearchState {
    search: string | null
    searchAttributes: Array<string>
    index: any
}

const initialState = {
    search: null,
    searchAttributes: defaultSearchAttributes,
    index: null, // search index opaque structure
}

export const enum TypeKeys {
    SET_SEARCH_ATTRIBUTES = "SET_SEARCH_ATTRIBUTES",
    SET_SEARCH = "SET_SEARCH",
    CLEAR_SEARCH = "CLEAR_SEARCH",
    CHANGE_SEARCH_FILTER = "CHANGE_SEARCH_FILTER",
    UPDATE_SEARCH_INDEX = "UPDATE_SEARCH_INDEX",
}

export interface SearchAction extends Action {
    type: TypeKeys
}

export default function reducer(state: SearchState = initialState, action, { _root_ }) {
    switch (action.type) {
        case TypeKeys.SET_SEARCH: {
            let value = action.value
            if (value && (value.length === 0 || value.trim() === "")) value = null
            return { ...state, search: action.value }
        }
        case TypeKeys.SET_SEARCH_ATTRIBUTES: {
            return { ...state, searchAttributes: action.searchAttributes }
        }
        case TypeKeys.CLEAR_SEARCH: {
            return { ...state, search: null };
        }
        case TypeKeys.UPDATE_SEARCH_INDEX: {
            const index = lunr(function () {
                state.searchAttributes.forEach(a => this.field(a))
                this.ref("id")
                // elasticsearchlunr has addField, setRef and saveDocument(false)

                // rebuild based on buffer which means the index may have dupes?
                // the activities may not be the list, its already "reduced"
                //selectData(_root_).buffer.forEach(item => this.add(item))
                selectData(_root_).buffer.forEach(item => this.add(item))
                // elasticsearchlunr has this outside the callback, and index.addDoc
            })
            return { ...state, index }
        }
        default:
            return state
    }
}

export const setSearch = value => ({ type: TypeKeys.SET_SEARCH, value });
export const clearSearch = () => ({ type: TypeKeys.CLEAR_SEARCH });

/** Change the search filter using the subaction then update the displayed data. */
export const changeSearchFilter = subaction => ({ type: TypeKeys.CHANGE_SEARCH_FILTER, subaction })

export const updateSearchIndex = () => ({ type: TypeKeys.UPDATE_SEARCH_INDEX })
/** Set the attributes used in search to an array of attributes in the common data model. */
export const setSearchAttributes = (searchAttributes) =>
    ({ type: TypeKeys.SET_SEARCH_ATTRIBUTES, searchAttributes })

export const selectSearch = (state) => state[STATE_KEY]

export const Actions = {
    setSearch,
    clearSearch,
    changeSearchFilter,
    updateSearchIndex,
    setSearchAttributes,
}

/**
 * Mutate lunrQuery to add query terms.
 * Search terms generated from splitting userString on spaces. Using
 * this means we cannot use the builtin query parser which
 * handles attribute targeted searches, boosting, etc.
 * @param userString User specified raw search string.
 * @param attributes List of valid attributes.
 * @praam lunrQuery Lunr Query object.
 * @returns void
 */
function buildQuery(userString: string, lunrQuery, attributes: Array<string> = []) {
    if (!lunrQuery || !userString || userString.trim() === "") return
    const parts = userString.split(" ")
    parts.forEach(term => {
        if (term.indexOf(":") > 0) { // must be at least one char in front of :
            const tparts = term.split(":")
            if (tparts.length > 0 && attributes.includes(tparts[0])) {
                // we have a prefix that indicates which attribute to search
                console.log("specific attribute search", tparts)
            }
        }

        lunrQuery.term(term, {
            wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
        })
    })
}

/**
 * Create a super-cool filter for the search box.
 * Search for subject, description.
 */
export function createSearchProcessor(state) {
    const search = selectSearch(state)
    return items => {
        const index = search.index
        const searchdata = search.search
        if (index && searchdata && searchdata.length > 0) {
            // const results = index.search(searchdata) // in score rank order
            const results =
                index.query(R.curry(buildQuery)(searchdata, R.__))
            const idsToMatch = results.map(r => r.ref)
            if (DEBUG) console.log("results", results, idsToMatch)
            return items.filter(i => idsToMatch.includes(i.id))
        }
        else return items
    }
}

export function* adjustSearchFilter() {
    console.log("Search filter watcher started.")
    const filterName = TypeKeys.CHANGE_SEARCH_FILTER
    const channel = yield actionChannel(filterName)
    while (true) {
        const action = yield take(channel)
        yield put.resolve(action.subaction)
        const state = yield select()
        switch (action.subaction.type) {
            case TypeKeys.SET_SEARCH: {
                const searchdata = selectSearch(state).search
                if (searchdata && searchdata.length > 0) {
                    yield put(DataActions.addProcessors([{
                        name: filterName,
                        description: "filter based on a search expression",
                        processor: createSearchProcessor(state),
                    }], true))
                } else {
                    yield put(DataActions.removeProcessors([filterName], true))
                }
                break
            }
            case TypeKeys.CLEAR_SEARCH: {
                yield put(DataActions.removeProcessors([filterName], true))
            }
        }
    }
}
