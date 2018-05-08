/**
 * Relativity view. Shows relationships using connections and standard
 * dynamics part-child connections. You can add additional data sources
 * to augment the data gathered by default. This module uses the default
 * data sources.
 */
import * as React from "react"
import * as ReactDOM from "react-dom"
import { Provider, connect } from "react-redux"
import { createStore, applyMiddleware, compose } from "redux"
import { Fabric } from "office-ui-fabric-react/lib"
import { getXrmP, getURLParameter } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import * as EF from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { RelativityComponent } from "./RelativityComponent"
import * as Data from "./Data"
import "@aappddeevv/dynamics-client-ui/lib/fabric/ensureIcons"
import { Client, mkClient } from "@aappddeevv/dynamics-client-ui"
import { API_POSTFIX, DEBUG } from "BuildSettings"
import { Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data"
import {
    DataSource, DataSourceContext, BaseDataSource,
    makeNodesEdgesFromList, mkDefaultDataSources,
} from "./datasources"
import { EmptyNodesAndEdges, NodesAndEdges, RelativityDAO } from "./Data"
import { IStyle, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { RelativityComponentProps } from "./RelativityComponent.types"
import * as R from "ramda"

const middleware = []
const store = createStore((state, action) => state, applyMiddleware(...middleware))

let composeEnhancers = compose
if (process.env.NODE_ENV !== "production") {
    if ((parent.window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
        // we are storing functions in our state, no remote dev!
        composeEnhancers =
            (parent.window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ serialize: true, name: "RelativityView" })
    }
}

export const defaultViewStyle: IStyle = {
}

/** Interfaces to a run() method to start up our views. */
export interface RelativityViewRunProps extends Record<string, any> {
    target?: HTMLElement | null

    /** Of root div element. */
    className?: string | null
    /** Of root div element. See [[defaultViewStyle]]. */
    style?: IStyle

    /** 
    * Props for the toplevel Relativity component. You could also override
    * dao and dataSource here vs in the run props.
    */
    relavitityComponentProps?: Partial<RelativityComponentProps>

    /** Provide your own Client. */
    client?: Client
    
    /** Provide your own Metadat. */
    metadata?: Metadata

    /** Provide your own DAO. */
    dao?: RelativityDAO

    /** Provide your own dataSource within an effect. */
    makeDataSource?: (ctx: DataSourceContext) => Promise<DataSource>
}

const NAME = "RelativityViewRunner"

export function run(props: RelativityViewRunProps) {
    if (DEBUG) console.log(`Calling ${NAME}.run`)
    getXrmP().then(xrm => {
        
        const data = getURLParameter("data", document.location.search)
        let params = {} as  { relativityViewRunProps?: Partial<RelativityViewRunProps>}
        try {
            params = JSON.parse(data || "{}")
        } catch(e) {
            console.log(`${NAME}: Error parsing data object from url. Continuing.`, e)
        }

        props = R.mergeDeepRight(props, params.relativityViewRunProps || {}) as RelativityViewRunProps

        const roleCategories = Data.defaultRoleCategories
        const client = props.client || mkClient(xrm, API_POSTFIX)
        const metadata = props.metadata || new Metadata(client)
        const rdao = props.dao || new Data.RelativityDAOImpl(client, { metadata })
        const context: DataSourceContext = {
            client,
            metadata,
            rdao: rdao
        }
        const dataSource = props.makeDataSource ? 
            props.makeDataSource(context) : 
             Promise.resolve(mkDefaultDataSources(context))

        const _className = mergeStyles(defaultViewStyle, props.className, props.style)

        const renderit = (target: HTMLElement, dataSource: DataSource) => 
        ReactDOM.render(
            <Fabric className={_className}>
                <Provider store={store}>
                    <EF.EntityForm xrm={xrm}>
                        <RelativityComponent
                            dao={context.rdao}
                            roleCategories={roleCategories}
                            dataSource={dataSource}
                            {...props.relativityComponentProps}
                        />
                    </EF.EntityForm>
                </Provider>
            </Fabric>,
            target)

        dataSource.then(ds => {
            if(props.target) renderit(props.target, ds)
        })
    })
}
