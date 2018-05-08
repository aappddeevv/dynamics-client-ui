/** Common data sources for relationship graphs. */

import { RelativityDAO, EmptyNodesAndEdges, NodesAndEdges } from "./Data"
import * as Data from "./Data"
import { Node, Edge, Direction } from "./nodes"
import R = require("ramda")
import { DEBUG } from "BuildSettings"
import {
    Metadata, Client, ClientProvider, MetadataProvider, Id,
} from "@aappddeevv/dynamics-client-ui/lib/Data"

export { Id }

export interface DataSourceContext extends ClientProvider, MetadataProvider {
    client: Client
    metadata: Metadata
    rdao: RelativityDAO
}

export interface FetchResult {
    nodes: Array<Node>
    edges: Array<Edge>
}

export type AsyncResult = Promise<FetchResult>

/** Obtain a value at a dotted path or return orElse. */
function dottedOr<I=any, T=any>(dottedPath: string, orElse: T | null): (i: I) => (T | null) {
    return R.pathOr(orElse, dottedPath.split("."))
}

/**
 * Merge the results of Array<{nodes:[], edges:[]}> properly by concatting
 * the nodes and edges lists together.
 */
const mergeResults = R.reduce(R.mergeWith(R.concat), {})

/**
 * Map over entities creating "to" nodes from the entities list and edges for each source-{each entity}
 * pair. Filters out nil entities. New nodes
 * are created with each entity as the "data." Edges are created and "data" is set
 * from the getEdgeData property/lamda on the entity. Note that nodes with 
 * with the same id placed into a cache could be overwritten so ensure you store
 * any node specific carefully if you need access to it. You may not be able to rely 
 * on the data if you have special needs. String data accessors can be dotted as `R.path` is used.
 * This is a very complex function that allows you to map over a list and extract
 * out nodes and edges using accessors.
 * 
 * @param source Source entity Id
 * @param entities List of entities, must have id and name data concepts.
 * @param getId Dotted path to original entity id inside entity, or a lambda.
 * @param makeNode Lambda to create a node from an entity.
 * @param makeEdge Lamda to create an edge.
 */
export function makeNodesEdgesFromList<T = any>(
    source: Id,
    entities: Array<T>,
    getId: (e: T) => Id,
    makeNode: (e: T) => Node,
    makeEdge: (srcid: Id, e: T) => Edge): NodesAndEdges {

    if (entities.length === 0) return Data.EmptyNodesAndEdges
    const tmp = entities.filter(e => !R.isNil(e))
    type Blah = [Id, Node]
    const nodes: Array<Blah> = tmp.map(c => [getId(c), makeNode(c)] as Blah)
    // create a mapping from original id to the new "node" id
    const mapping: Record<Id, Id> = nodes.reduce((accum, p) => { accum[p[0]] = p[1].id; return accum }, {})

    return {
        nodes: nodes.map(p => p[1]),
        //edges: tmp.map(c => makeEdge(mapping[getId(c)], c))
        edges: tmp.map(c => makeEdge(source, c))
    }
}


export const EmptyFetchResult = EmptyNodesAndEdges

/**
 * Core data source API. A data source may return no data
 * for a specific entity because it is not configured for it, however,
 * every data source is "asked" to provide data.
 */
export interface DataSource {
    /**
     * Fetch nodes and edges for a given entity.
     */
    fetch(entityId: string, entityName: string,
        data: Record<string, any> & { roleIds?: Array<string> }): Promise<FetchResult>
    Name: string
}

/** 
 * Base data source object to inherit from. Make sure you call the 
 * parent constructor in your subclass.
 */
export abstract class BaseDataSource implements DataSource {

    constructor(ctx: DataSourceContext) {
        this.ctx = ctx
    }
    protected ctx: DataSourceContext

    /**
     * Lookup the object type code and return the entityName. Since object type codes
     * should come from server-side data only, throw an exception if it is not found.
     */
    protected LookupTypeCodeOr(objectTypeCode: number) {
        return this.ctx.rdao.lookupTypeCode(objectTypeCode)
    }

    abstract async fetch(entityId: string, entityName: string,
        data: Record<string, any> & { roleIds?: Array<string> }): Promise<FetchResult>

    abstract get Name(): string

}

/**
 * Data source that never returns data.
 */
export class EmptyDataSource extends BaseDataSource {
    constructor(ctx: DataSourceContext) {
        super(ctx)
    }

    public async fetch(entityId: string, entityName: string, data: any): Promise<FetchResult> {
        return EmptyNodesAndEdges
    }

    get Name() { return "relativity.empty" }
}

/**
 * Fetch relationships using *from* (left side) an entity. Could we do this through
 * the navigation property of the entity e.g. <entity>_connections1 but we would need
 * to heavily filter on the 1:n and I'm not sure that's allowed yet. Returned dynamics
 * connections are processed into the standardized Connection data model. 
 */
export class ConnectionsDataSource extends BaseDataSource {

    constructor(ctx: DataSourceContext) {
        super(ctx)
        //this.connectionsById = {}
    }

    public static Name = "relativity.connections"
    get Name() { return ConnectionsDataSource.Name }

    public async fetch(entityId: string, entityName: string,
        data: { roleIds: Array<string> }): Promise<FetchResult> {
        return this.ctx.rdao.fetchRelativityConnections(entityId, entityName, data.roleIds).
            then(r => {
                const connections = r.map(newc => Data.prepConnection(newc, entityId))
                return this.ctx.rdao.processConnections(entityId, connections)
            }).
            catch(e => {
                console.log(`${this.Name}.fetch: Unable to dynamically load data for`, entityId, entityName, e)
                return EmptyNodesAndEdges
            })
    }
}

export const defaultContactSelects = ["fullname"]
export const defaultAccountSelects = ["name"]

/** Fetch relationships for parent contacts for a contact. */
export class ParentChildForContact extends BaseDataSource {
    constructor(ctx: DataSourceContext) {
        super(ctx)
    }

    public static Name = "relativity.parentChildForContact"
    get Name() { return ParentChildForContact.Name }

    public async fetch(entityId: string, entityName: string, data): Promise<FetchResult> {
        if (entityName !== "contact") return EmptyNodesAndEdges
        const contact = await this.ctx.rdao.getEntity<any>(entityId, "contact", {
            select: ["fullname"],
            expand: [
                { Property: "parentcustomerid_contact", Select: ["fullname", "lastname", "firstname"] },
                { Property: "parentcustomerid_account", Select: ["name"] },
                { Property: "contact_customer_contacts", Select: ["fullname", "lastname", "firstname"] }
            ]
        })
        if (DEBUG) console.log(`${this.Name}.fetchResults`, contact)

        const sourceNode = new Node(contact.fullname, entityId,
            entityId, entityName, `${contact.lastname}_${contact.firstname}`)

        // if parent customer is contact
        const blah1 = makeNodesEdgesFromList(entityId,
            [contact.parentcustomerid_contact],
            (e: any) => e.contactid,
            (e: any) => new Node(e.fullname, e.contactid, e.contactid, "contact", `${e.lastname}_${e.firstname}`),
            (sid: Id, e: any) => new Edge(`${sid}_${e.contactid}`, sid, e.contactid, "Parent Contact", Direction.Out,
                `${e.lastname}_${e.firstname}`, e.contactid, "contact"))

        // if parent customer is account
        const blah2 = makeNodesEdgesFromList(entityId,
            [contact.parentcustomerid_account],
            //"Parent Account"
            (e: any) => e.accountid,
            (e: any) => new Node(e.name, e.accountid, e.accountid, "account"),
            (sid: Id, e: any) => new Edge(`${sid}_${e.accountid}`, sid, e.accountid, "Parent Account", Direction.Out,
                e.name, e.accountid, "account")
        )

        // contacts related in a tree
        const blah3 = makeNodesEdgesFromList(entityId,
            contact.contact_customer_contacts,
            //"Child Contacts",
            (e: any) => e.contactid,
            (e: any) => new Node(e.fullname, e.contactid, e.contactid, "contact", `${e.lastname}_${e.firstname}`),
            (sid: Id, e: any) => new Edge(`${sid}_${e.contactid}`, sid, e.contactid, "Child Contacts", Direction.Out,
                `${e.lastname}_${e.firstname}`, e.contactid, "contact")
        )

        if (DEBUG)
            console.log(`${this.Name}.fetch: parentcustomerid_contact, parentcustomerid_account, contact_customer_contacts`,
                blah1, blah2, blah3)

        return mergeResults([
            { nodes: [sourceNode], edges: [] }, blah1, blah2, blah3]) as AsyncResult
    }
}

/** 
 * Given an account, find all parent child relationships programmed into the standard
 * dynamics data model.
 */
export class ParentChildForAccount extends BaseDataSource {
    constructor(ctx: DataSourceContext) {
        super(ctx)
    }

    public static Name = "relativity.parentChildForAccount"
    get Name() { return ParentChildForAccount.Name }

    public async fetch(accountId: string, entityName: string, data): Promise<FetchResult> {
        if (entityName !== "account") return Data.EmptyNodesAndEdges

        // asking for a specific entity will expand nav properties
        const contacts = await this.ctx.rdao.getEntity<any>(accountId, "account", {
            select: ["name"],
            expand: [
                { Property: "contact_customer_accounts", Select: ["fullname", "lastname", "firstname"] }, // an array, pretty sure
                { Property: "primarycontactid", Select: ["fullname", "lastname", "firstname"] }, // an object
                { Property: "account_master_account", Select: ["name"] }, // parent account, account this was merged into
                { Property: "account_parent_account", Select: ["name"] } // subaccounts of this account, array
            ]
        })

        if (DEBUG) console.log(`${this.Name}.parentChild`, contacts)

        const sourceNode = new Node(contacts.name, accountId, accountId, entityName, contacts.name)

        const primary = makeNodesEdgesFromList(accountId,
            [contacts.primarycontactid],
            //"Primary Contact",
            (e: any) => e.contactid,
            (e: any) => new Node(e.fullname, e.contactid, e.contactid, "contact", `${e.lastname}_${e.firstname}`),
            (sid: Id, e: any) => new Edge(`${sid}_${e.contactid}`, sid, e.contactid, "Primary Contact", Direction.Out,
                `${e.lastname}_${e.firstname}`, e.contactid, "contact")
        )

        const others = makeNodesEdgesFromList(accountId,
            contacts.contact_customer_accounts,
            //"All Contacts",
            (e: any) => e.contactid,
            (e: any) => new Node(e.fullname, e.contactid, e.contactid, "contact", `${e.lastname}_${e.firstname}`),
            (sid: Id, e: any) => new Edge(`${sid}_${e.contactid}`, sid, e.contactid, "All Contacts", Direction.Out,
                `${e.lastname}_${e.firstname}`, e.contactid, "contact")
        )

        const master = makeNodesEdgesFromList(accountId,
            contacts.account_master_account,
            //"Master Accounts",
            (e: any) => e.accountid,
            (e: any) => new Node(e.name, e.accountid, e.accountid, "account"),
            (sid: Id, e: any) => new Edge(`${sid}_${e.accountid}`, sid, e.accountid, "Master Accounts", Direction.Out,
                e.name, e.accountid, "account")
        )

        const subs = makeNodesEdgesFromList(accountId,
            contacts.account_parent_account,
            //"Sub Accounts",
            (e: any) => e.accountid,
            (e: any) => new Node(e.name, e.accountid, e.accountid, "account"),
            (sid: Id, e: any) => new Edge(`${sid}_${e.accountid}`, sid, e.accountid, "Sub Accounts", Direction.Out,
                e.name, e.accountid, "account")
        )

        if (DEBUG)
            console.log(`${this.Name}.fetch:`,
                "\nsource node", sourceNode,
                "\nprimary", primary,
                "\nothers", others,
                "\nmaster", master,
                "\nsubs", subs)
        return mergeResults([{ nodes: [sourceNode], edges: [] }, primary, others, master, subs]) as AsyncResult
    }
}

/**
 * Generic but hard to configure parent-child relationship fetcher.
 * DON'T USE THIS YET!
 * @param selects Select on main entity to return that is being looked up, not the expands!
 * @param expands [{Property: string, Select: Array<string>, accessors, relationshipLabel: string}]. Accessors: { entityName: string|function, id: string|function, label: string|function }.
 */
export class GenericParentChild extends BaseDataSource {
    constructor(ctx: DataSourceContext, entityName: string, selects: Array<string>, expands: Array<any>) {
        super(ctx)
        this.entityName = entityName
        this.selects = selects
        this.expands = expands
    }
    protected entityName: string
    protected selects: Array<string>
    protected expands: Array<any>

    public static Name = "relativity.genericParentChild"
    get Name() { return GenericParentChild.Name + `-${this.entityName}` }

    public async fetch(entityId: string, entityName: string, data): Promise<FetchResult> {
        const rdata = await this.ctx.rdao.getEntity<any>(entityId, this.entityName, {
            select: this.selects,
            // can only take a subset of properties in expand parameter
            expand: this.expands.map(e => R.pick(["Property", "Select"], e))
        })
        if (DEBUG) console.log(`${this.Name}.parentChild`, rdata)
        const fdata = this.expands.map(e => {
            const value = rdata![e!.Property!] // could be array or single entity
            const relationshipLabel = e.relationshipLabel || "unlabelled"
            const accessors = e.accessors
            return makeNodesEdgesFromList(entityId,
                Array.isArray(value) ? value : [value],
                (e: any) => e.id,
                (e: any) => new Node(e.label, e.id, e.id, e.entityName),
                (sid: Id, e: any) => new Edge(e.id, sid, e.id, e.label, Direction.Out, undefined, e.id, e.entityName)

                // relationshipLabel,
                // accessors.entityName,
                // accessors.id,
                // accessors.label
            )
        })
        if (DEBUG) console.log(`${this.Name}.fetch: data`, fdata)
        return mergeResults(fdata) as AsyncResult
    }
}

/**
 * Wrap a fetch in try-catch so it can't bork the other delegates.
 * For now, just return an empty answer if it fails and print to the console.
 */
async function safeFetch(fetch: () => Promise<FetchResult>, name: string): Promise<FetchResult> {
    try {
        return fetch()
    } catch (e) {
        console.log(`Error fetching nodes and edges: Provider ${name}`, e)
        return EmptyFetchResult
    }
}

/**
 * Can aggregate multiple data sources. Downside, if one fails, they all fail.
 * Simultaneously issues fetch requests to all delegates. Should we run this in
 * a promise pool to limit concurrency? All delegated data sources run in parallel
 * since its expected that there are not more than a dozen data sources. In debug
 * mode the results from each datasource is output to the console.
 */
export class DelegatingDataSource implements DataSource {
    constructor(sources: DataSource | Array<DataSource>) {
        if (!Array.isArray(sources)) this.sources = [sources]
        else this.sources = sources
    }
    protected sources: Array<DataSource>

    public static Name = "relativity.delegatingDataSource"
    get Name() { return DelegatingDataSource.Name + this.sources.map(s => s.Name).join(", ") }

    public async fetch(entityId: string, entityName: string, data): Promise<FetchResult> {
        const allQueries = this.sources.map(s =>
            safeFetch(() => s.fetch(entityId, entityName, data), s.Name).then(results => [s.Name, results]))
        const allPairs = await Promise.all(allQueries)
        if (DEBUG) {
            allPairs.forEach(p => {
                const label = p[0]
                const result = p[1]
                console.log(`${this.Name} results: `, label, result)
            })
        }
        const all = allPairs.map(p => p[1])
        if (DEBUG) console.log(`${this.Name}.all`, all, mergeResults(all))
        return mergeResults(all) as AsyncResult
    }
}

/** Curry or other: [data source instances] */
export function mkDefaultDataSources(ctx: DataSourceContext, other: Array<DataSource> = []): DataSource {
    let std: Array<DataSource> = [
        new ConnectionsDataSource(ctx),
        new ParentChildForContact(ctx),
        new ParentChildForAccount(ctx)
    ]
    if (other) std = std.concat(other)
    return new DelegatingDataSource(std)
}
