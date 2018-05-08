/**
 * Graph database and datamodel
 */
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { NodeRenderProps } from "./RelativityComponent.types"

/** Counter only used for edges. Nodes should have their entity id as the id. */
let counter = -1

/**
 * Get and increment the counter used to generate ids. Ids start at 0.
 */
export function getAndIncrement(): number {
    counter += 1
    return counter
}

export interface BaseObject {
    // node id is the dynamics entity id, or at least it should be 
    id: string
    label: string
    sortKey: string
}

export interface EntityBacked {
    entityName: string
    //data?: T
}

export interface VisualNode {
    wasExpanded: boolean
}

/**
 * A Node is an entity in Dynamics e.g. contact, account, <thingey>.
 * Total hack on entityName=contact to use the lastname+firstname
 * as the sort key if their is data attached.
 * @param label Label for node. A node renderer can override this. 
 * @param id Node id. Must be unique in "node scope"
 * @param dataId Dynamics id. This is often but not always, the same as the id.
 * @param entityName Dynamics entity logical name.
 * @param sortKey Optional sort key to for display ordering instead of "label". Defaults to label.
 */
export class Node implements BaseObject, EntityBacked, VisualNode {
    constructor(label: string, id: string, dataId: string, entityName: string, sortKey?: string) {
        this._label = label
        this.id = id
        this.wasExpanded = false
        this.entityName = entityName
        this._sortKey = sortKey
        this.dataId = dataId
    }
    public dataId: string
    protected _label: string
    public id: string
    public wasExpanded: boolean
    public entityName: string
    protected _sortKey?: string

    /** Should we keep a per-node renderer option? Renderer factory should be sufficient. */
    protected _onRender: IRenderFunction<NodeRenderProps>
    get onRender(): IRenderFunction<NodeRenderProps> { return this._onRender }
    set onRender(r: IRenderFunction<NodeRenderProps>) { this._onRender = r }

    get label(): string { return this._label }
    get sortKey(): string {
        if (!this._sortKey && !this._label)
            throw Error(`Node: Both sort key and label are nil, node id ${this.id}`)
        return this._sortKey ? this._sortKey : this.label.toLowerCase()
    }
}

export enum Direction {
    Out = 1,
    In = 2,
}

interface BaseEdge {
    id: string
    source: string
    target: string
    /** Label for an edge really forms a "group by" label when shown in tree mode. */
    label: string
}

/**
 * source, target id pair. Label is the "edge label" to display by default in the UI
 * when grouping nodes together. Nodes can optionally have a direction. It is recommended
 * that if the Edge is from an entity-entity relationship (e.g. parent-child) the id
 * should be a composite of the left and right entity ids. If its a connection object.
 * the id should be the connection entity id. If its an edge from an intermediatea
 * entity, the id should be from that intersection entity. 
 * You could also use the function `getAndIncrement` contained in this module.
 * @param id Edge id. Must be unique in edge space.
 * @param source Source id
 * @param target Target id
 * @param label Label to display on edge. An edge renderer can override this.
 * @param dir Direction. Not sure this is needed.
 * @param sortKey Sort key for display ordering. Default is the label.
 * @param dataId If this edge is represented by an entity in dynamics, the dynamics id.
 * @param entityName Like dataId, but the entity logical name.
 */
export class Edge implements BaseObject {
    constructor(id: string, source: string, target: string, label: string,
        dir: number = Direction.Out, sortKey?: string, dataId?: string, entityName?: string) {
        this.id = id
        this.source = source
        this.target = target
        this.label = label
        this.dir = dir
        this._entityName = entityName
        this._dataId = dataId
    }
    public id: string
    public source: string
    public target: string
    public label: string
    public dir?: Direction
    protected _sortKey?: string
    protected _entityName?: string
    protected _dataId?: string

    get sortKey(): string { return this._sortKey ? this._sortKey : this.label.toLowerCase() }
    get title(): string { return this.label }
    get entityName(): string | null { return this._entityName ? this._entityName : null }
    get dataId(): string | null { return this._dataId ? this._dataId : null }
}
