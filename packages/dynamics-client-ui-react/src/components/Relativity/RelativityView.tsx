/**
 * Relativity view. Shows relationships using connections and standard
 * dynamics part-child connections. You can add additional data sources
 * to augment the data gathered by default. This module uses the default
 * data sources.
 */
import * as React from "react"
import { render } from "react-dom"
import { Provider, connect } from "react-redux"
import { createStore, applyMiddleware, compose } from "redux"
const cx = require("classnames")
import { Fabric } from "office-ui-fabric-react/lib"
import {
    getXrmP, getEntityInfo, getURLParameter,
} from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import * as EF from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
//const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
import { RelativityComponent } from "./RelativityComponent"
import * as Data from "./Data"
import "@aappddeevv/dynamics-client-ui/lib/fabric/ensureIcons"
import { Client, mkClient } from "@aappddeevv/dynamics-client-ui"
import { API_POSTFIX } from "BuildSettings"
import { Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data"
import {
    DataSourceContext, BaseDataSource,
    makeNodesEdgesFromList, mkDefaultDataSources,
} from "./datasources"
import { EmptyNodesAndEdges, NodesAndEdges } from "./Data"
import { IStyle, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { RelativityComponentProps } from "./RelativityComponent.types"

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
export interface RelativityRunProps extends Record<string, any> {
    target: HTMLElement | null
    eid?: string
    uid?: string
    ename?: string
    tcode?: string

    /** Of root HTML element. */
    className?: string | null
    /** Of root HTML element. See [[defaultViewStyle]]. */
    style?: IStyle

    relavitityComponentProps?: Partial<RelativityComponentProps>
}

export function run(props: RelativityRunProps) {
    const {
        target, eid, uid, ename, tcode,
        className, style, relativityComponentProps,
    } = props

    getXrmP().then(xrm => {
        let root: RelativityComponent | null = null

        const { userId = null, entityId = null, entityName = null, entityTypeCode = null } =
            {
                entityId: eid, userId: uid, entityName: ename, entityTypeCode: tcode,
                ...getEntityInfo(xrm),
            }

        const data = getURLParameter("data", document.location.search)
        const params = JSON.parse(data || "{}") || {}

        // process config object as well...
        const roleCategories = props.roleCategories || Data.defaultRoleCategories
        const client = props.client || mkClient(xrm, API_POSTFIX)
        const metadata = new Metadata(client)
        // @ts-ignore
        const context = {
            client,
            metadata,
            // @ts-ignore
            rdao: new Data.RelativityDAOImpl(client, { metadata }),
        }
        /** Override the data sources to add your own but include these in your overall list. */
        const dataSource = mkDefaultDataSources(context)

        const _className = mergeStyles(defaultViewStyle, className, style)

        render(
            <Fabric className={_className}>
                <Provider store={store}>
                    <EF.EntityForm xrm={xrm}>
                        <RelativityComponent
                            dao={context.rdao}
                            roleCategories={roleCategories}
                            style={props.style}
                            dataSource={dataSource}
                            ref={c => root = c}
                            {...relativityComponentProps}
                        />
                    </EF.EntityForm>
                </Provider>
            </Fabric>,
            target)
    })
}
