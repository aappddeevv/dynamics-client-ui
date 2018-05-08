/**
 * RelativityComponent. Shows relationships using connections and standard
 * dynamics parent-child connections.
 */
import * as React from "react"

import { SearchBox } from "office-ui-fabric-react/lib/SearchBox"
import { IconButton } from "office-ui-fabric-react/lib/Button"
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar"
import { mergeDeepRight } from "ramda"
import { Node, Edge } from "./nodes"
import { DEBUG } from "BuildSettings"
import { Id } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { RelativityDAO } from "./Data"

/** Callback args. */
export interface ChangeCallbackArgs {
    graphDb: GraphDb
}

/** Callback signature. */
export type ChangeCallback = (arcgs: ChangeCallbackArgs) => void

const NAME = "GraphDb"

/** 
 * In memory graph database (i.e. big cache) that acts much like a redux store.
 * The graph db maintains the graph structure as well as
 * cached entity data based on the nodes added to the cache.
 * Datasources should do minimal fetches of data, just enough to
 * create the data structures needed including the label and sort keys
 * for a node or edge. The graph db will automatically fetch and store
 * entity information. It pulls the full entity record by default which 
 * is why all nodes must contain the entity id and entity name (entity logical name).
 * 
 * In memory, the id space for nodes and edges are different, so the same id
 * can appear in both places, potentially.
 * 
 * @todo Customize entity info fetching.
*/
export class GraphDb {
    constructor(dao: RelativityDAO) {
        this.dao = dao
    }
    protected dao: RelativityDAO

    protected isDispatching: boolean = false
    protected currentListeners: Array<ChangeCallback> = []
    protected nextListeners: Array<ChangeCallback> = this.currentListeners

    private _data: Record<Id, any> = {}
    private _nodes: Record<Id, Node> = {}
    private _edges: Record<Id, Edge> = {}
    private _edgesCache: Record<Id, Array<Id>> = {}

    public printit = () => {
        console.log("GraphDb",
            "\nnodes", this._nodes,
            "\nedges", this._edges,
            "\ndata", this._data)
    }

    /** 
     * Always fetch and always replace the data in the graph db for a specific entity.
     * Promise completes when the fetch completes.
     */
    protected fetchData = async (id: Id, entityName: string): Promise<void> => {
        this.dao.getEntity(id, entityName)
            .then(e => {
                const existing = this._data[id]
                this._data[id] = e
                return e
            })
            .catch(e => {
                console.log(`Error fetching ${entityName}(${id})`, e)
                // should we retry?
            })
    }

    /** Fetch if the data for node id is missing. */
    protected fetchIfMissing = async (id: Id, entityName: string): Promise<any> => {
        const existing = this._data[id]
        if (!existing) return this.fetchData(id, entityName)
        else return Promise.resolve(existing)
    }

    /** 
     * Add a node, merging the parameter with an existing nanyhe cache. The Promise
     * completes when the data has been fetched. No dispatch is issued.
     */
    public addNodes = async (n: Array<Node>): Promise<void> => {
        const self = this
        const fetches = n.map(node => {
            const existing = this._nodes[node.id]
            //if (DEBUG) console.log("GraphDb.add", node, "\nexisting", existing, "\ncache", this._nodes)
            if (!existing) { this._nodes[node.id] = node }
            return this.fetchIfMissing(node.dataId, node.entityName)
        })
        return Promise.all(fetches)
            .then(() => {
                //self.dispatch()
            })
            .catch(e => {
                console.log(`${NAME}.add: Error fetching node data`, e)
            })
    }

    /** Get any data is available for a specific graph object at this point in time. */
    public getData = (id: Id): any | null => {
        const data = this._data[id]
        return data ? data : null
    }

    /** Get a node. */
    public getNode = (id: Id): Node => {
        const existing = this._nodes[id]
        if (existing) return existing
        throw new Error(`GraphDb.node: Request for non-existant node id: ${id}`)
    }

    /** 
     * Add an edge. If there is an entityName on the edge, try to fetch it.
     */
    public addEdges = (edges: Array<Edge>): Promise<void> => {
        const fetches = edges.map(e => {
            const existing = this._edges[e.id]
            if (existing) return Promise.resolve()
            this._edges[e.id] = e
            let entry = this._edgesCache[e.source]
            if (!entry) { entry = []; this._edgesCache[e.source] = entry }
            entry.push(e.id)

            if (e.dataId && e.entityName) return this.fetchIfMissing(e.dataId, e.entityName)
            else return Promise.resolve()
        })
        return Promise.all(fetches)
            .then(() => {
                // run a dispatch?
            })
    }

    /** 
     * Add both nodes and edges. The Promise completes when the
     * db has fetched the underlying data. A dispatch is issued at the end. This
     * should be the main entry point for adding data to the graph.
     */
    public addNodesAndEdges = (nodes: Array<Node>, edges: Array<Edge>): Promise<void> => {
        const self = this
        return Promise.all([this.addEdges(edges), this.addNodes(nodes)]).
            then(() => {
                self.dispatch()
            })
    }

    /** Get an Edge or throw an error. */
    public getEdge = (id: Id): Edge => {
        const existing = this._edges[id]
        if (existing) return existing
        throw new Error(`GraphDb.getEdge: Request for non-existant edge id: ${id}`)
    }

    /** Get edges for a specific source node. */
    public getEdgesFor = (nodeId: Id): Array<Id> => {
        const existing = this._edgesCache[nodeId]
        if (existing) return existing
        return []
    }

    /** Indexed by dynamics entity id. */
    get nodes() { return this._nodes }

    /** Indexed by a synthetic id. */
    get edges() { return this._edges }

    /** Indexed by source id (node) to [edge id] */
    get edgesCache() { return this._edgesCache }

    /** Empty the graph database */
    public reset = () => {
        this._data = {}
        this._nodes = {}
        this._edges = {}
        this._edgesCache = {}
    }

    protected ensureCanMutateNextListeners = () => {
        if (this.nextListeners === this.currentListeners) {
            this.nextListeners = this.currentListeners.slice()
        }
    }

    public subscribe = (listener: ChangeCallback) => {
        if (typeof listener !== 'function') {
            throw new Error('Expected listener to be a function.')
        }
        let isSubscribed = true
        this.ensureCanMutateNextListeners()
        this.nextListeners.push(listener)
        return function unsubscribe() {
            if (!isSubscribed) return
            isSubscribed = false
            this.ensureCanMutateNextListeners()
            const index = this.nextListeners.indexOf(listener)
            this.nextListeners.splice(index, 1)
        }
    }

    public dispatch = (action?: any) => {
        // if (!isPlainObject(action)) {
        //     throw new Error(
        //         'Actions must be plain objects. ' +
        //         'Use custom middleware for async actions.'
        //     )
        // }

        // if (typeof action.type === 'undefined') {
        //     throw new Error(
        //         'Actions may not have an undefined "type" property. ' +
        //         'Have you misspelled a constant?'
        //     )
        // }

        if (this.isDispatching) {
            throw new Error('Reducers may not dispatch actions.')
        }

        try {
            this.isDispatching = true
            //currentState = currentReducer(currentState, action)
        } finally {
            this.isDispatching = false
        }
        const listeners = this.currentListeners = this.nextListeners
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i]
            listener({
                graphDb: this
            })
        }
        return action
    }

}
