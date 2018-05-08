/**
 * Misc data support for relativity views mostly about processing connections.
 *
 * TODO: Separate out the metadata parts into another class.
 */

import {
    Metadata, ConnectionRole, ConnectionRoleCategory, In, ClientProvider,
    ExpandQueryOptions,
} from "@aappddeevv/dynamics-client-ui/lib/Data"
const R = require("ramda")
import { Node, Edge, } from "./nodes"
import { cleanId, Client } from "@aappddeevv/dynamics-client-ui"
import { DEBUG } from "BuildSettings"

export const defaultRoleCategories = [
    "Social",
    "Business",
    "Family",
    "School",
    "Personal Interaction"
]

export const defaultRelativitySelect = [
    "createdon",
    "modifiedon",
    "name",
    "connectionid",
    "record1objecttypecode",
    "record2objecttypecode",
    "_record1id_value",
    "_record2id_value",
    "_record1roleid_value",
    "_record2roleid_value",
    "_relatedconnectionid_value", // could dedupe off of this
    "ismaster"
]

/**
 * Access `connection` data for an entity. Confusingly, `DataSource` fetches entities.
 * Contains a few basic data fetch calls mostly centered around some metadata but also
 * connections since connections are a fundamental building block to model any
 * relationship.
 */
export interface RelativityDAO extends ClientProvider {
    /**
     * Lookup the object type code and return the entityName. Since object type codes
     * should come from server-side data only, throw an exception if it is not found.
     */
    lookupTypeCode(objectTypeCode: number): Promise<string>

    /**
     * Generate children and labels for the right side of the connection.
     * Uses the right side of the connection to set the Edge label. All of
     * source sides (left) of the connections returned should be fromId but that is
     * not checked.
     * @param fromId Left (from) side entity.
     */
    processConnections(fromId: string, connections: Array<Connection>): Promise<NodesAndEdges>

    /**
     * Fetch connections for specific connection role ids. Supports self-referencing
     * relationships as well although that should be rare. The entity can represent
     * either the left (record1) or right side (record2) of the relationship and
     * roleIds are always for the opposite side unless both left and right are true.
     * Connection objects are *not* prepped using `prepConnection`.
     *
     * @param entityId Dynamics entity id of the from or to. See left, right.
     * @param entityName Entity name *not* the entity set name.
     * @param roleIds List of role ids (not names) to find. Get these from metadata.
     * @param select attributes to return.
     * @param left true, force entityId to match on the left side. Default is true.
     * @param right true, force entitId to match on the right side. Default is false.
     * @param masterOnly true, only return master connectionss. Default is false.
     */
    fetchRelativityConnections(entityId: string,
        entityName: string,
        roleIds: Array<string>,
        opts?: {
            select?: Array<string>,
            left?: boolean,
            right?: boolean,
            masterOnly?: boolean,
        }): Promise<Array<object>>

    /** Return all [{category, role}] pairs given role category names. See global option set Category. */
    categoryRoleNamesToRoles(roleCategoryNames: Array<string>):
        Promise<Array<{ category: ConnectionRoleCategory, role: ConnectionRole }>>

    /** Return an entity given its id and singular logical name or return null. Options allow you to select 
     * the attributes to return and the properties to expand.
     * @param select Select attributes
     * @param expand Properties to expand e.g. collections. Expanded in place, not just @odata.nextlink returned.
    */
    getEntity<T>(id: string, entityName: string, opts?: {
        select?: Array<string>, expand?: Array<ExpandQueryOptions>
    }): Promise<T | null>

}

export interface RelativityDAOImplOpts {
    chunkSize: number
    metadata: Metadata
}

/** Default option for `fetchRelativityConnectons`. */
export const DefaultFetchOpts = {
    left: true,
    right: false,
    select: defaultRelativitySelect,
    masterOnly: false
}

const NAME = "RelativityDAOImpl"

/** Default implementation. */
export class RelativityDAOImpl implements RelativityDAO, ClientProvider {

    constructor(client: Client, opts: Partial<RelativityDAOImplOpts>) {
        this._client = client
        this.metadata = opts.metadata ? opts.metadata : new Metadata(client)
        if (opts.chunkSize) this.chunkSize = opts.chunkSize
    }

    protected chunkSize: number = 5
    protected _client: Client
    protected metadata: Metadata

    get client(): Client { return this._client }

    /**
     * Lookup the object type code and return the entityName. Since object type codes
     * should come from server-side data only, throw an exception if it is not found.
     */
    public async lookupTypeCode(objectTypeCode: number) {
        return this.metadata.lookupObjectTypeCodeByCode(objectTypeCode).
            then(tc => {
                if (!tc) throw Error(`Object type code not found ${objectTypeCode}.`)
                return tc!.LogicalName
            })
    }

    public async processConnections(fromId: string, connections: Array<Connection>):
        Promise<NodesAndEdges> {
        // use the right "default property" of the entity,
        // shouldn't this just be the right entity id--it could be!
        const grouped = R.groupBy(R.path(["right", "name"]), connections)
        const nodes = await Promise.all(
            Object.keys(grouped).map(k => {
                return this.lookupTypeCode(grouped[k][0].right.objectTypeCode).
                    then(entityName => new Node(k,
                        grouped[k][0].right.id,
                        grouped[k][0].right.id, entityName))
            }))
        // create edges
        const edges = connections.map(conn =>
            new Edge(conn.id, fromId, conn.right.id, conn.right.roleStr))
        if (DEBUG) console.log(`${NAME}.processConnections`,
            "\nconnections", connections,
            "\nnodes", nodes,
            "\nedges", edges)
        return { nodes, edges }
    }

    public async fetchRelativityConnections(entityId: string,
        entityName: string,
        roleIds: Array<string>,
        opts?: {
            select?: Array<string>,
            left?: boolean,
            right?: boolean,
            masterOnly?: boolean,
        }) {
        const popts = { ...DefaultFetchOpts, ...opts }
        const splits: Array<Array<Promise<any>>> =
            R.splitEvery(this.chunkSize, roleIds).
                map(someRoleIds =>
                    this.fetchRelativityConnectionsChunk(entityId, entityName, someRoleIds,
                        popts.select, popts.left, popts.right, popts.masterOnly))
        return Promise.all(R.flatten(splits)).then(r => R.flatten(r))
    }

    /**
     * Fetch connections for specific connection role ids. Part of the chunk strategy.
     */
    protected async fetchRelativityConnectionsChunk(entityId: string,
        entityName: string,
        roleIds: Array<string>,
        select: Array<string> = defaultRelativitySelect,
        left: boolean = true,
        right: boolean = false,
        masterOnly: boolean = false) {

        const leftRoleFilter = In("record1roleid", roleIds)
        const rightRoleFilter = In("record2roleid", roleIds)
        const filter = (left && right) ?
            `(${leftRoleFilter} or ${rightRoleFilter})` :
            ((left && !right)) ? leftRoleFilter : rightRoleFilter

        const leftId = left ? `_record1id_value eq ${entityId}` : null
        const rightId = right ? `_record2id_value eq ${entityId}` : null
        const id = (left && right) ?
            `(${leftId}) or (${rightId})` :
            ((left && !right) ? leftId : rightId)

        const qopts = {
            FormattedValues: true,
            Filter:
                (masterOnly ? `ismaster eq true and ` : "") +
                `(${id}) and ` +
                "(statecode eq 0) and " +
                filter,
            Select: select.length > 0 ? select : undefined,
        }
        return this.client.GetList("connections", qopts).
            then(r => r.List)
    }

    /** Return all [{category, role}] */
    public async categoryRoleNamesToRoles(roleCategoryNames: Array<string> = defaultRoleCategories):
        Promise<Array<{ category: ConnectionRoleCategory, role: ConnectionRole }>> {
        const cats = await this.metadata.getConnectionRoleCategories()
        const roles = await this.metadata.getConnectionRoles()

        // array of cat objects for desired role categories
        const catObjs = roleCategoryNames.
            map(cname => cats.find(c => c.Label === cname))

        const pairs = catObjs.map(cat =>
            roles.filter(r => r!.category === cat!.Value). // get roles we want, array
                map(role => ({ category: cat, role }))) // pairs
        return R.flatten(pairs)
    }

    /** Get an entity given its id and singular name or return null. */
    public async getEntity<T>(id: string, entityName: string, opts?: {
        select?: Array<string>, expand?: Array<any> | any
    }) {
        const popts = { select: [], expand: null, ...opts }
        const n = await this.metadata.getEntitySetName(entityName)
        if (!n) return null
        const qopts = {
            FormattedValues: true,
            Select: popts.select && popts.select.length > 0 ? popts.select : undefined,
            Expand: popts.expand ? (Array.isArray(popts.expand) ? popts.expand : [popts.expand]) : undefined,
        }
        return this.client.Get<T>(n, id, qopts)
    }
}

export default RelativityDAOImpl

export interface NodesAndEdges {
    nodes: Array<Node>
    edges: Array<Edge>
    /** @deprecated */
    authoritative?: boolean
}

export const EmptyNodesAndEdges = { nodes: [], edges: [] }

/** One end point of a connectin. */
export interface ConnectionEnd {
    id: string
    objectTypeCode: number
    objectType: string
    name: string
    roleId: string
    roleStr: string
}

/** 
 * Standardized data model for a connection in the Relativity app.
 * Contains a breakout for the left and right sides based on
 * record1 and record2 respectively.
 */
export interface Connection {
    id: string
    createdOn: number
    modifiedOn: number
    createdOnStr: string
    modifiedOnStr: string
    name: string
    left: ConnectionEnd
    right: ConnectionEnd
    /** @deprecated Use left or right. */
    display: ConnectionEnd
    /** The id of the connection that is the reciprocal (non-master), if there is one. Could be null. */
    reciprocalId: string | null
    /** When a two-way connection is created, one side may be considered the master. */
    isMaster: boolean
    originalRecord: Record<string, any>
}

/**
 * Convert a raw dynamics connection to a domain object with right and left broken out into objects
 * named "right" and "left".
 */
export function prepConnection(c: Record<string, any>, meId?: string): Connection {
    const left = {
        id: c._record1id_value,
        objectTypeCode: c.record1objecttypecode,
        objectType: c["record1objecttypecode@OData.Community.Display.V1.FormattedValue"],
        name: c["_record1id_value@OData.Community.Display.V1.FormattedValue"],
        roleId: c._record1roleid_value,
        roleStr: c["_record1roleid_value@OData.Community.Display.V1.FormattedValue"],
    }

    const right = {
        id: c._record2id_value,
        objectTypeCode: c.record2objecttypecode,
        objectType: c["record2objecttypecode@OData.Community.Display.V1.FormattedValue"],
        name: c["_record2id_value@OData.Community.Display.V1.FormattedValue"],
        roleId: c._record2roleid_value,
        roleStr: c["_record2roleid_value@OData.Community.Display.V1.FormattedValue"],
    }

    return {
        id: c.connectionid,
        createdOn: c.createdon,
        modifiedOn: c.modifiedon,
        createdOnStr: c["createdon@OData.Community.Display.V1.FormattedValue"],
        modifiedOnStr: c["modifiedon@OData.Community.Display.V1.FormattedValue"],
        name: c.name,
        left,
        right,
        display: left,

        reciprocalId: c._relatedconnectionid_value,
        isMaster: c.ismaster,

        // Temporary hack to make sure we keep the data around in more raw form
        originalRecord: c,
    }
}

