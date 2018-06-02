/**
 * ActivitiesCalendarView: Default config for ActivitiesCalendarComponent.
 * If you can customize the display using the "run" function and the props,
 * do it, otherwise you need to write your own "run" driver.
 */
import * as React from "react"
import { render } from "react-dom"
import createSagaMiddleware, { SagaIterator, SagaMiddleware } from "redux-saga"
import { call, put, select, all } from "redux-saga/effects"
import { Provider, connect } from "react-redux"
import { createStore, applyMiddleware, compose, Store } from "redux"
import { ActivitiesCalendarComponentR } from "./ActivitiesCalendarComponent"
import {
    CalendarViewActions as CalActions, enhancers as defaultEnhancerFactory, sagaFactory, init, reducers,
} from "./redux"
import {
    Actions as VActions, DAO, createSagas, SagaFactory,
    combineEnhancerFactories, combineDataSourceFactories,
    SagaFactoryContext, combineSagaFactories, EnhancerFactory
} from "../ActivitiesReader"
import * as Crm from "../ActivitiesReader/crm"
import * as Utils from "../ActivitiesReader/datasources/Utils"
import {
    Factory as CalendarFactory,
} from "../ActivitiesReader/datasources/calendaractivities"

import Dynamics from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Dynamics"
import { Fabric } from "office-ui-fabric-react/lib"
import { combineReducers, Reducer3 } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/combineReducers"
import { HOC } from "@aappddeevv/dynamics-client-ui/lib/react/component"
import moment = require("moment")
import { getXrmP } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import { Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data"
import * as R from "ramda"
// technically, should only be included once...
import "@aappddeevv/dynamics-client-ui/lib/fabric/ensureIcons"
import { DEBUG, API_POSTFIX } from "BuildSettings"
import {
    ActionCreator, Action, MultiActionCreator, MultiSelectActionCreator,
} from "@aappddeevv/dynamics-client-ui/lib/Dynamics/actionutils"
import { XRM, Client, mkClient } from "@aappddeevv/dynamics-client-ui"
import { css } from "office-ui-fabric-react/lib/Utilities"
import {
    ActivitiesCalendarComponentStyles, ActivitiesCalendarComponentClassNames,
    ActivitiesCalendarComponentProps,
} from "./ActivitiesCalendarComponent.types"
import {
    IStyle, mergeStyles
} from "office-ui-fabric-react/lib/Styling"

let composeEnhancers = compose
if (process.env.NODE_ENV !== "production") {
    if ((parent.window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
        // we are storing functions in our state, no remote dev!
        composeEnhancers =
            (parent.window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ serialize: true, name: "ActivitiesCalendar" })
    }
}

export function defaultActivityTypeFilter(a) {
    if ([
        "phonecall",
        "recurringappointmentmaster",
        "task",
        "appointment",
    ].includes(a.value)) return true
    return false
}

/** Toplevel default view style, *not* the actual ActivitiesCalendarComponent. */
export const defaultViewStyle: IStyle = {
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    height: "calc(100% - 10px)",
    width: "calc(100% - 40px)",
    overflow: "hidden",
}

export interface ActivitiesCalendarRunProps {
    target: HTMLElement | null
    // not sure why this is here
    //entityId?: string | null
    userId?: string | null
    /** Of root HTML element. */
    className?: string | null
    /** Of root HTML element. See [[defaultViewStyle]]. */
    style?: IStyle
    /** Default big-calendar view = "week" */
    defaultView?: string
    /** Default date in a string format that moment.parse() understands. */
    defaultDate?: string

    /** 
     * Initialize reference data override. Includes default init function which must be called. 
     * The sagas are run before the component is mounted to reduce render performance issues.
     */
    initReferenceData?: (m: Metadata, n: Date, dateView: string, standardInit: InitReferenceData) => SagaIterator

    /** 
     * Though you could use initReferenceData to set activity types to display, you 
     * can use this filter more easily. =
     */
    activityTypeFilter?: ActivityTypeFilter

    /** Props passed to the calendar component. */
    calendarComponentProps?: Partial<ActivitiesCalendarComponentProps>

    /**
     * FIlter to include activities in the calendar. Returning yes to the logical name (in value) 
     * means show in calendar. NOT USED YET
     */
    activityFilter?: ActivityTypeFilter

    /** Client to use */
    client?: Client

    /** Additional saga factory. */
    sagaFactory?: SagaFactory

    /** Additional reducers to add to the state.  */
    reducer?: Record<string, Reducer3<any>>

    /** Enhancer factory, combine with defaultEnhancerFactory. */
    enhancerFactory?: EnhancerFactory

    /** Enhance the final component with a higher order component. */
    compose?: HOC<any>
}

export type InitReferenceData = (m: Metadata, n: Date, dateView: string) => SagaIterator
export type ActivityTypeFilter = (activityType: { value: string }) => boolean

/** Default saga to init reference data. */
export function* initReferenceData(m: Metadata, n: Date, dateView: string,
    activityTypeFilter: ActivityTypeFilter): SagaIterator {
    // @ts-ignore
    const ref = yield call(() => Utils.fetchActivityTypes(m))
    const atypes = ref.filter(activityTypeFilter)
    //const atypes = ref.filter(activityOnlyFilter)
    const sorted = R.sortBy(R.prop("label"), atypes) || []
    if (DEBUG) console.log("ActivitiesCalendar: activity types", sorted)
    yield put(VActions.Filter.activityTypes.SET_REFDATA(sorted))
    yield put(VActions.Filter.activityTypes.SET_ALL())

    yield put(VActions.Filter.states.SET_REFDATA(Crm.activityStateOptions || []))
    yield put(VActions.Filter.states.SET_ALL())
    yield put(CalActions.requestUsers())
    yield put(VActions.Filter.owners.SET_ALL())
    yield put.resolve(CalActions.setDates(moment(n), dateView))
}

function renderIntoDOM(xrm: XRM, store: Store<any>, target: HTMLElement,
    props?: Partial<ActivitiesCalendarComponentProps>,
    className: string | null = null, hoc: HOC<any> = R.identity, styles?: IStyle) {
    const _className = mergeStyles(defaultViewStyle, className, styles)
    const X = hoc(ActivitiesCalendarComponentR)
    render(
        <Fabric className={_className}>
            <Provider store={store}>
                <Dynamics xrm={xrm}>
                    <X {...props} />
                </Dynamics>
            </Provider>
        </Fabric>,
        target)
}

export function run(props: ActivitiesCalendarRunProps) {
    const { target, userId, className, style, initReferenceData: initR,
        defaultDate, defaultView, calendarComponentProps, client: pclient,
        sagaFactory: propsSagaFactory, reducer: propsReducer, compose,
        enhancerFactory,
    } = props
    if (!target) console.log("ActivitiesCalendar.run: target is not defined")
    getXrmP().then(xrm => {
        const uid = userId || xrm.Utility.getGlobalContext().getUserId()
        const n = defaultDate ? moment(defaultDate) : moment() // defaults to today
        const view = defaultView || "week"

        const client = pclient ? pclient : mkClient(xrm, API_POSTFIX)
        const metadata = new Metadata(client)
        const dao = new DAO(client)

        const iprops = { client, dao, xrm, userId }
        ////////////////////////
        const isagas = propsSagaFactory ? combineSagaFactories([sagaFactory, propsSagaFactory])(iprops) : sagaFactory(iprops)
        const dataSourcesP = CalendarFactory({ dao })
        const enhancersP = enhancerFactory ? enhancerFactory({ client, dao }) : defaultEnhancerFactory({ client, dao })
        const otherinitsagas = createSagas(enhancersP, dataSourcesP)

        // init data is contained in an effect
        return Promise.all([isagas, otherinitsagas]).then(inits => {
            const sagaMiddleware = createSagaMiddleware()
            const middlewares = [sagaMiddleware]
            /////////////////////
            const store = createStore(combineReducers({ ...reducers, ...propsReducer }),
                composeEnhancers(applyMiddleware(...middlewares)))
            const effects = R.flatten(inits).map(f => call(f))
            sagaMiddleware.run(function* () { yield all(effects) })
            return [store, sagaMiddleware]
        }).
            then(tup => {
                const hoc: HOC<any> = compose || R.identity
                const store = tup[0] as Store<any>
                const smiddle = tup[1] as SagaMiddleware<any>
                smiddle.run(function* () {
                    // run till exhausted
                    // curried init
                    const curriedInit = R.curry(initReferenceData)
                    const filter = props.activityTypeFilter ?
                        props.activityTypeFilter : defaultActivityTypeFilter
                    yield* initR ?
                        initR(metadata, n.toDate(), view,
                            curriedInit(R.__, R.__, R.__, filter)) :
                        initReferenceData(metadata, n.toDate(), view, filter) // sequential

                    yield call(init, { userId: uid as string, xrm })
                })
                return target !== null ?
                    renderIntoDOM(xrm, store, target, calendarComponentProps, className, hoc, style) :
                    null
            })
            .catch(e => {
                console.log("ActivitiesCalendar initialization error", e)
            })
    })
}

