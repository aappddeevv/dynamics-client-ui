/**
 * graph database and datamodel
 */

let counter = -1

/**
 * Get and increment the counter used to generate ids. Ids start at 0.
 */
export function getAndIncrement(): number {
    counter += 1
    return counter
}

interface BaseNode {
    id: string
    label: string
    sortKey: string
}

interface EntityNode<T = any> {
    entityName: string
    data?: T
}

interface VisualNode {
    wasExpanded: boolean
}

/**
 * A Node is an entity in Dynamics e.g. contact, account, <thingey>.
 * Total hack on entityName=contact to use the lastname+firstname
 * as the sort key if their is data attached.
 */
export class Node {
    constructor(label: string, id: string, entityName: string,
        data: any | null = null, sortKey?: string) {
        this._label = label
        this.id = id
        this.data = data
        this.wasExpanded = false
        this.entityName = entityName
        this._sortKey = sortKey
    }
    protected _label: string
    public id: string
    public data: any | null
    public wasExpanded: boolean
    public entityName: string
    protected _sortKey?: string

    get label(): string { return this._label }
    get sortKey(): string {
        if (!this._sortKey && this.entityName === "contact" && this.data) {
            return `${this.data.lastname}_${this.data.firstname}`
        }
        return (this._sortKey ? this._sortKey : this._label.toLowerCase())
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
    label: string
}

/**
 * souruce, target id pair. Label is the "edge label" to display by default in the UI
 * when grouping nodes together. Nodes can optionally have a direction.
 */
export class Edge {
    constructor(id: string, source: string, target: string, label: string,
        dir: number = Direction.Out, sortKey?: string) {
        this.id = id
        this.source = source
        this.target = target
        this.label = label
        this.dir = dir
    }
    public id: string
    public source: string
    public target: string
    public label: string
    public dir?: Direction
    protected _sortKey?: string

    get sortKey(): string { return this._sortKey ? this._sortKey : this.label.toLowerCase() }
    get title(): string { return this.label }
}

/**
 * For connection based edges.
 */
export class ConnectionEdge extends Edge {
    constructor(source: string, target: string, label: string, connectionId: string) {
        super(getAndIncrement().toString(), source, target, label)
        this.connectionId = connectionId
    }
    public connectionId: string
}

/**
 * For simple entity-entity relationships.
 */
export class SimpleEdge extends Edge {
    constructor(source: string, target: string, label: string, data?: any) {
        super(getAndIncrement().toString(), source, target, label)
        this.data = data
    }
    public data: any
}

/**
 * Entity to Entity to edge.
 */
export const E2EEdge = SimpleEdge
