/**
 * Core set of actions.
 */

import { ActionCreator } from "redux"
import { Actions as DataActions, DataAction } from "./data"
import { Actions as FilterActions, FilterAction, TypeKeys as FilterTypeKeys } from "./filter"
import { Actions as SearchActions, SearchAction, TypeKeys as SearchTypeKeys } from "./search"
import { Actions as ViewActions, ViewAction } from "./view"
import { Action } from "redux"
import {
    MultiSelectActionCreator, SingleSelectActionCreator, WrapperActionCreator,
} from "@aappddeevv/dynamics-client-ui/lib/Dynamics/actionutils"

export {
    DataActions,
    FilterActions,
    SearchActions,
    ViewActions,
    Action
}

export const Actions = {
    Data: DataActions,
    Filter: FilterActions,
    Search: SearchActions,
    View: ViewActions,
}

export default Actions
