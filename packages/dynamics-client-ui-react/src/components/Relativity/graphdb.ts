/**
 * RelativityComponent. Shows relationships using connections and standard
 * dynamics parent-child connections.
 */
import * as React from "react"

import { SearchBox } from "office-ui-fabric-react/lib/SearchBox"
import { IconButton } from "office-ui-fabric-react/lib/Button"
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar"

import { Node, Edge } from "./nodes"
import { DEBUG } from "BuildSettings"
import { Id } from "@aappddeevv/dynamics-client-ui/lib/Data"

/** In memory graph database. */
export class GraphDb {
    constructor() {
        this.reset()
    }

    private _nodes: Record<Id, Node> = {}
    private _edges: Record<Id, Edge> = {}
    private _edgesCache: Record<Id, Array<Id>> = {}


    /** Indexed by dynamics entity id. */
    get nodes() { return this._nodes }

    /** Indexed by a synthetic id. */
    get edges() { return this._edges }

    /** Indexed by source id (node) to [edge id] */
    get edgesCache() { return this._edgesCache }

    /** Empty the graph database */
    public reset = () => {
        this._nodes = {}
        this._edges = {}
        this._edgesCache = {}
    }
}
