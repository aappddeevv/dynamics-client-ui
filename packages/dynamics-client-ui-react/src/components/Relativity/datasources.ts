/** Common data sources for relationship graphs. */

import { RelativityDAO, EmptyNodesAndEdges, NodesAndEdges } from "./Data"
import * as Data from "./Data"
import { Node, SimpleEdge, Edge } from "./nodes"
import R = require("ramda")
import { DEBUG } from "BuildSettings"
import { Metadata, Client } from "@aappddeevv/dynamics-client-ui/lib/Data"

export interface DataSourceContext {
    client: Client
    metadata: Metadata
    rdao: RelativityDAO
}

export interface FetchResult {
    nodes: Array<Node>
    edges: Array<Edge>
}

type AsyncResult = Promise<FetchResult>

export const EmptyFetchResult = EmptyNodesAndEdges

export interface DataSource {
    fetch(entityId: string, entityName: string,
        data: Record<string, any> & { roleIds?: Array<string> }): Promise<FetchResult>
    Name: string
}

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
 * Merge the results of Array<{nodes:[], edges:[]}> properly.
 */
const mergeResults = R.reduce(R.mergeWith(R.concat), {})

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
 * to heavily filter on the 1:n and I'm not sure that's allowed yet. The results
 * are cached.
 *
 * TODO: Use the cache.
 */
export class ConnectionsDataSource extends BaseDataSource {

    constructor(ctx: DataSourceContext) {
        super(ctx)
        this.connectionsById = {}
    }
    protected connectionsById: Record<string, any>

    public static Name = "relativity.connections"
    get Name() { return ConnectionsDataSource.Name }

    protected cacheConnections(connections) {
        const cacheEntries = connections.reduce((accum, c) => { accum[c.id] = c; return accum }, {})
        Object.assign(this.connectionsById, cacheEntries)
    }

    public async fetch(entityId: string, entityName: string,
        data: { roleIds: Array<string> }): Promise<FetchResult> {
        return this.ctx.rdao.fetchRelativityConnections(entityId, entityName, data.roleIds).
            then(r => {
                const connections = r.map(newc => Data.prepConnection(newc, entityId))
                this.cacheConnections(connections)
                return this.ctx.rdao.processConnections(entityId, connections)
            }).
            catch(e => {
                console.log("Unable to dynamically load data for", entityId, entityName, e)
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
            nav: [
                { Property: "parentcustomerid_contact" },
                { Property: "parentcustomerid_account" },
                { Property: "contact_customer_contacts" }
            ]
        })
        if (DEBUG) console.log(`${this.Name}.fetchResults`, contact)

        const blah1 = makeNodesEdgesFromList(entityId,
            [contact.parentcustomerid_contact],
            "Parent Contact",
            "contact", s => s.contactid, s => s.fullname)

        const blah2 = makeNodesEdgesFromList(entityId,
            [contact.parentcustomerid_account],
            "Parent Account",
            "account", s => s.accountid, s => s.name)

        const blah3 = makeNodesEdgesFromList(entityId,
            contact.contact_customer_contacts,
            "Child Contacts",
            "contact", s => s.contactid, s => s.fullname)
        if (DEBUG)
            console.log("parentcustomerid_contact, parentcustomerid_account, contact_customer_contacts",
                blah1, blah2, blah3)
        return mergeResults([blah1, blah2, blah3]) as AsyncResult
    }
}

/**
 * Map over entities creating nodes and edges. Filters out nil entities.
 * @param source Source entity Id
 * @param entities List of entities, must have id and name data concepts.
 * @param entityName Entity name of the nodes that are created.
 * @param getId Fieldname of id or a lambda taking the entity.
 * @param getName Fieldname of the name or a lambda taking the entity.
 * @param getSortKey Fieldname of the field for sorting or a lambda taking the entity.
 */
export function makeNodesEdgesFromList<T = any>(
    source: string,
    entities: Array<T>,
    label: string,
    entityName: string,
    getId: ((e: T) => string) | string,
    getName: ((e: T) => string) | string,
    getSortKey?: ((e: T) => string) | string): NodesAndEdges {

    if (entities.length === 0) return Data.EmptyNodesAndEdges
    const _getId = typeof getId === "string" ? (e: T) => e[getId] : getId
    const _getName = typeof getName === "string" ? (e: T) => e[getName] : getName
    const _getSortKey = typeof getSortKey === "string" ?
        (e: T) => e[getSortKey] :
        (typeof getSortKey === "undefined" ? _getName : getSortKey)
    const tmp = entities.filter(e => !R.isNil(e))
    return {
        nodes: tmp.map(c => new Node(_getName(c), _getId(c), entityName, c)),
        edges: tmp.map(c => new SimpleEdge(source, _getId(c), label)),
    }
}

export class ParentChildForAccount extends BaseDataSource {
    constructor(ctx: DataSourceContext) {
        super(ctx)
    }

    public static Name = "relativity.parentChildForAccount"
    get Name() { return ParentChildForAccount.Name }

    public async fetch(accountId: string, entityName: string, data): Promise<FetchResult> {
        if (entityName !== "account") return Data.EmptyNodesAndEdges

        const contacts = await this.ctx.rdao.getEntity<any>(accountId, "account", {
            select: ["name"],
            nav: [
                { Property: "contact_customer_accounts" }, // an array, pretty sure
                { Property: "primarycontactid" }, // not an array or an object? not sure...
                { Property: "account_master_account" }, // parent account, array
                { Property: "account_parent_account" } // subaccounts of this account, array
            ]
        })

        if (DEBUG) console.log(`${this.Name}.parentChild`, contacts)

        const primary = makeNodesEdgesFromList(accountId,
            [contacts.primarycontactid], "Primary Contact", // not sure this works with just an id
            "contact", "contactid", "fullname")

        const others = makeNodesEdgesFromList(accountId,
            contacts.contact_customer_accounts, "All Contacts",
            "contact", "contactid", "fullname")

        const master = makeNodesEdgesFromList(accountId,
            contacts.account_master_account, "Master Accounts",
            "account", "accountid", "name")

        const parent = makeNodesEdgesFromList(accountId,
            contacts.account_parent_account, "Sub Accounts",
            "account", "accountid", "name")

        if (DEBUG)
            console.log("primary, others, master, parent", primary, others, master, parent)
        return mergeResults([primary, others, master, parent]) as AsyncResult
    }
}

/**
 * Generic but hard to configure parent-child relationship fetcher.
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
            nav: this.expands.map(e => R.pick(["Property", "Select"], e))
        })
        if (DEBUG) console.log(`${this.Name}.parentChild`, rdata)
        const fdata = this.expands.map(e => {
            const value = rdata![e!.Property!] // could be array or single entity
            const relationshipLabel = e.relationshipLabel || "unlabelled"
            const accessors = e.accessors
            return makeNodesEdgesFromList(entityId,
                Array.isArray(value) ? value : [value],
                relationshipLabel,
                accessors.entityName,
                accessors.id,
                accessors.label)
        })
        if (DEBUG) console.log("data", fdata)
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
 * a promise pool to limit concurrency?
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
        const all = await Promise.all(this.sources.
            map(s => safeFetch(() => s.fetch(entityId, entityName, data), s.Name)))

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
