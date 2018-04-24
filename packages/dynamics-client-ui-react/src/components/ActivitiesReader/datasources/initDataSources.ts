/**
 * Initialization support for data sources.
 */
import R = require("ramda")
import { DAO, navPropertyMapping } from "./DAO"
import { Client, CRMWebAPI } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { DataSource, DataSourceFactory } from "./interfaces"
import { combineDataSourceFactories } from "./Utils"
import { DEBUG } from "BuildSettings"

import { Factory as RollupFactory, FactoryProps as RollupFactoryProps } from "./rollup"
import { Factory as RegardingFactory, FactoryProps as RegardingFactoryProps } from "./regarding"
import { Factory as ConnectionsFactory, FactoryProps as ConnectionsFactoryProps } from "./connections"
import { Factory as ActivityPartyFactory, FactoryProps as ActivityPartyFactoryProps } from "./activityparty"
import { Factory as AnnotationsFactory, FactoryProps as AnnotationsFactoryProps } from "./annotations"

export interface InitArgs {
    entityName: string
    entitySetName: string
    userId?: string
    regarding?: Partial<RegardingFactoryProps>
    connections?: Partial<ConnectionsFactoryProps>
    activityParty?: Partial<ActivityPartyFactoryProps>
    annotations?: Partial<AnnotationsFactoryProps>
    rollup?: Partial<RollupFactoryProps>
}

/**
 * A DataSourceFactory that initializas all common data sources. None of the sources
 * will have overlapping names. You need to look at each data source to understand
 * any specilaized data needed for its initialization and pass those in. Function
 * is curried.
 */
// tslint:disable-next-line:align
export const initDataSources = (client: Client, dao: DAO): DataSourceFactory<InitArgs> =>
    (args: InitArgs) => {
        if (DEBUG) console.log("initDataSources: provided args", args)
        return Promise.all([
            ActivityPartyFactory({
                dao,
                ...args.activityParty,
            }),
            RollupFactory({
                dao,
                entitySet: args.entitySetName,
                ...args.rollup,
            }),
            // @ts-ignore, can we prove we have navProperty?
            RegardingFactory({
                dao,
                entitySet: args.entitySetName,
                navProperty: navPropertyMapping[args.entityName],
                ...args.regarding,
            }),
            ConnectionsFactory({
                dao,
                ...args.connections,
            }),
            AnnotationsFactory({
                dao,
                ...args.annotations,
            }),
        ]).then(R.mergeAll)
    }

export default initDataSources
