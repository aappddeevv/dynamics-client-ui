/**
 * RelativityComponent. Shows relationships using connections and standard
 * dynamics parent-child connections.
 */
import * as React from "react"
import { Requireable } from "prop-types"
import { css } from "office-ui-fabric-react/lib/Utilities"
import R = require("ramda")
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox"
import { IconButton } from "office-ui-fabric-react/lib/Button"
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar"
const tstyles = require("!!style-loader!css-loader!rc-tree/assets/index.css")
import Tree, { TreeNode } from "rc-tree"
import { defaultRoleCategories, RelativityDAO } from "./Data"
import { cleanId, hash } from "@aappddeevv/dynamics-client-ui/lib/Data/Utils"
import EntityLink from "@aappddeevv/dynamics-client-ui/lib/Components/EntityLink"
import { DataSource, EmptyDataSource, DataSourceContext } from "./datasources"
import { Node, Edge } from "./nodes"
import { DEBUG } from "BuildSettings"
import { DynamicsContext } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Dynamics"
import { EntityFormChildProps, EntityForm } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { Notifier, NotificationManager } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/NotificationManager"
import { setStatePromise } from "@aappddeevv/dynamics-client-ui/lib/react/component"
import { Id } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { GraphDb, ChangeCallbackArgs } from "./graphdb"
import { FetchResult } from "./datasources"

import {
    RelativityComponentProps, RelativityComponentClassNames,
    RelativityComponentStyles, EdgeTitleRenderProps, NodeRenderProps,
} from "./RelativityComponent.types"
import { getClassNames } from "./RelativityComponent.classNames"
import { getStyles } from "./RelativityComponent.styles"

export const RenderBy = {
    /** relationships as children of a node first */
    Relationship: 0,
    /** entities as children of a node first */
    Entity: 1,
}

function clean(id: Id | null): string | null {
    if (id) return cleanId(id)
    return null
}

export interface State {
    root: any
    filters: Array<RegExp>
    maxLevels: number
    roleCategories: Array<string>
    expandedKeys: Array<string>

    [pname: string]: any
}

/**
 * Show hierarchy of nodes and edges using interesting groupings. To be
 * efficient, the data is lazily accessed as the tree is expanded, hence
 * the need for DAOs. This shows relationships between entities (nodes)
 * it does not try to show a hierarchy of records. You can have
 * an account have a relationship with different roles and for each role-account
 * combiation a tree level will be shown, but if there are dynamics
 * records that indicate that a role-account combination exists twice,
 * it will only be shown once. For example, you may have a contact
 * record that relates to an account through an employment concept, but
 * if that contact worked for that account at two different times, the
 * account only shows up once under the employment concept.
 *
 * @todo Seperate out the graph db from the view class.
 */
export class RelativityComponent extends React.Component<RelativityComponentProps, State> {

    public displayName = "RelativityComponent"

    private _styles: RelativityComponentStyles
    private _classNames: RelativityComponentClassNames

    constructor(props: RelativityComponentProps, context) {
        super(props, context)
        this.state = {
            root: null, // root node
            roleCategories: props.roleCategories || defaultRoleCategories,
            expandedKeys: [], // cache: expanded keys
            filters: [], // array of regexs
            maxLevels: props.maxLevels || 20,
        }
        // misc caches not related to display state
        this.allRoles = []
        this.allRoleIds = []

        this.dataSource = props.dataSource
        this.dao = props.dao
        this.graphDb = props.graphDb || new GraphDb(this.dao)

        this.graphDb.subscribe(this.graphUpdate)
    }

    public static contextTypes = {
        ...EntityForm.childContextTypes
    }

    private dao: RelativityDAO
    public context: DynamicsContext
    private dataSource: DataSource

    private allRoles: any[]
    private allRoleIds: any[]

    private graphDb

    public static defaultProps = {
        maxLevels: 10,
        renderBy: RenderBy.Relationship,
    }

    public graphUpdate = (args: ChangeCallbackArgs): void => {
        this.forceUpdate()
    }

    protected reportError = (message: string) => {
        if (this.context.notifier)
            this.context.notifier.add({ message, level: "ERROR", removeAfter: 10 })
    }

    /** Empty all caches. */
    protected resetCache = () => {
        this.graphDb.reset()
    }

    /**
     * Refresh from the root down. We need to figure out how
     * to maintain expansions and refresh children retrieving
     * the entire tree. Merge??
     */
    protected refresh = () => {
        this.resetCache()
        this.getRootConnections()
            .then(() => {
                if (this.props.onRefresh) this.refresh()
            })
    }

    /** single or array. ignores replace attribute */
    protected cacheNode = (node: Node | Array<Node>, replace = false) => {
        if (!node) return
        if (!Array.isArray(node)) node = [node]
        this.graphDb.addNodes(node)
    }

    /** Single or array. Adds to edge cache and edgesCache */
    protected cacheEdge = (edge: Edge | Array<Edge>) => {
        if (!edge) return
        if (!Array.isArray(edge)) edge = [edge]
        edge.forEach(e => this.graphDb.addEdge(e))
        //console.log("cacheEdge. after updating",  this.edgesCache)
    }

    protected getReferenceData = () => {
        const self = this
        return this.dao.categoryRoleNamesToRoles(this.state.roleCategories).
            then(croles => {
                self.allRoles = croles
                self.allRoleIds = self.allRoles.map(rp => rp.role.connectionroleid)
                if (DEBUG) console.log("allRoles", self.allRoles, self.allRoleIds)
                return { allRoles: self.allRoles, allRoleIds: self.allRoleIds }
            }).
            catch(e => {
                console.log("Error obtaining roleis or specified role categories",
                    self.state.roleCategories, e)
                return { allRoles: [], allRoleIds: self.allRoleIds }
            })
    }

    /** Gets root entity from server using component state. Does not update state. Returns a Node. */
    protected getRootEntity = async (): Promise<Node | null> => {
        const self = this
        if (!this.props.entityId || !this.props.entityName) return null
        else return this.dao.getEntity<any>(this.props.entityId, this.props.entityName).
            then(entity => {
                const n = new Node(entity.fullname, this.props.entityId!,
                    this.props.entityName!, /*entity,*/ `${entity.lastname}-${entity.firstname}`)
                this.cacheNode(n)
                return n
            }).
            catch(e => {
                console.log("Error obtaining root entity info", this.props.entityId,
                    this.props.entityName, e)
                this.reportDataError()
                return null
            })
    }

    /** Run the datasource and return the results. Results are cached automatically. */
    protected getData = (entityId: string, entityName: string, moreProps = {}) => {
        return this.dataSource.fetch(entityId, entityName,
            {
                roleIds: this.allRoleIds,
                parentId: entityId,
                rootEntityId: this.props.entityId,
                ...moreProps
            }).
            then(stuff => {
                return this.graphDb.addNodesAndEdges(stuff.nodes, stuff.edges)
            }).
            catch(e => {
                console.log("Error obtaining graph data", e, entityId, entityName, moreProps)
                throw e
            })
    }

    protected reportDataError = (e?: Error) => {
        this.reportError("There was an error obtaining graph data. You may want to refesh your browser.")
    }

    /**
     * Get root entity and root connections. Sets root entity state.
     */
    protected getRootConnections = (): Promise<Node | null> => {
        const self = this
        if (!this.props.entityId || !this.props.entityName) return Promise.resolve(null)
        return this.getRootEntity().then(node =>
            this.getReferenceData().then(() => // we need this set on the object before the next flatMap
                this.getData(self.props.entityId!, self.props.entityName!).
                    then(() => {
                        node!.wasExpanded = true
                        this.setState({ root: node })
                        return node
                    }).
                    catch(e => {
                        console.log("Error obtaining root relativities",
                            self.props.entityId, e)
                        this.reportDataError(e)
                        return null
                    })
            ))
    }

    public componentDidMount() {
        this.getRootConnections()
    }

    static extractId = (key) => key.split(":")[1]

    /** Make a key like "ent:id:right" */
    static mkEntityKey = (id, right) => `ent:${id}:${right}`
    static extractEntR = new RegExp("(^ent):(.+):.+$")
    /** Extract entity id from a key made with `mkEntityKey`. */
    static extractEnt = (key) => {
        const res = RelativityComponent.extractEntR.exec(key)
        if (res) return res[2]
        return null
    }

    /** Make a key like: "rel:relname:parentid:right" */
    static mkRelKey = (rel, parentId, right) => `rel:${rel}:${parentId}:${right}`
    static extractRelR = new RegExp("(^rel):(.+):(.+):.+$")
    static extractRel = (key) => {
        const res = RelativityComponent.extractRelR.exec(key)
        if (res) return res[2]
        return null
    }

    /** @todo Investigate forceData calls. Are they necessary? */
    protected onLoadData = (treeNode) => {
        if (DEBUG) console.log(`${this.displayName}.onLoadData`, treeNode)
        const self = this
        const id = RelativityComponent.extractId(treeNode.props.eventKey)

        if (RelativityComponent.extractRel(treeNode.props.eventKey)) {
            // its a relationship so we don't need to expand, data's already there.
            return Promise.resolve(null)
        }
        // it's a real entity node
        const node = this.graphDb.getNode(id)

        // return if already expanded, we don't need to retrieve the same data again
        if (node.wasExpanded || treeNode.props.isLeaf) {
            //this.forceUpdate()
            return Promise.resolve(node)
        }

        return this.getData(node.id, node.entityName).
            then(stuff => {
                node.wasExpanded = true
                //this.forceUpdate()
                return node
            }).
            catch(e => {
                console.log("Error loading tree data on demand", node, e)
                this.reportDataError()
            })
    }

    /**
     * Render edges from a node (the "to" side).
     * Edges should all have the "node" parameter as the "source" so that
     * all edges are node -> <some other node>. The edges are grouped
     * by their labels and then each groupby "label->[grouped nodes]" are rendered.
     * Each group by (grouped nodes) are deduped by their target ids.
     * Groupby rendering sorts by the edge label.
     * @param node Parent
     * @param edges Edges to group, dedupe then render
     */
    protected renderByRole = (node: Node, edges: Array<Edge>, level: number, path: Array<any>) => {
        // if (DEBUG) console.log(`${this.displayName}.renderByRole`,
        //     "\nnode", node,
        //     "\nedges", edges,
        //     "\nlevel", level,
        //     "\npath", path)
        const edgesByRole: Record<string, Array<Edge>> = R.groupBy(R.prop("label"), edges) as any
        //if (DEBUG) console.log(`${this.displayName}.renderByRole: edges grouped by roles`, edgesByRole)
        const nextlevel = level + 1
        // concatenate the node id
        const ppath = path.concat([node.id])
        return Object.keys(edgesByRole).
            sort().
            map(role => {
                const edgeTitleProps = {
                    label: role
                }
                const title = this.props.onRenderEdgeTitle ?
                    this.props.onRenderEdgeTitle(edgeTitleProps, renderEdgeTitle) :
                    renderEdgeTitle(edgeTitleProps)
                // expand out Edge.targets (which are nodes of course), sort edges by their label, dedupe by their targets
                const dedupedEdges = R.uniqWith((a, b) => a.target === b.target, edgesByRole[role])
                const pairs =
                    R.sortBy(n => n[1].sortKey, dedupedEdges.map((e: Edge) => [e, this.graphDb.getNode(e.target)]))
                const key = RelativityComponent.mkRelKey(role, node.id, level)
                const pathWithRole = [...ppath, role]
                const tn =
                    <TreeNode title={title || role} key={key} isLeaf={false} disabled={false}>
                        {
                            pairs.length > 0 ?
                                pairs.map(p => this.renderTreeNode(p[1], node, nextlevel, pathWithRole, p[0] as Edge)) :
                                null
                        }
                    </TreeNode>
                return tn
            })
    }

    /**
     * Given a node (domain object), generate <TreeNode> and their children.
     * This function only renders entities. Children are rendered according to the state.
     * @param node Node to render.
     * @param parent Parent node. Root has null.
     * @param level Numerical level from the previous node. Edge "tree nodes" are not in here.
     * @param path Path from root to node, including node and with and the root node id at index 0.
     * @param edge The edge that this node is being rendered under. Root node renders under role null.
     */
    protected renderTreeNode = (node: Node, parent: Node | null = null, level: number = 0, path: any[] = [], edge: Edge | null = null) => {
        if (DEBUG) console.log(`${this.displayName}.renderTreeNode`,
            "\nnode", node,
            "\nparent", parent,
            "\nlevel", level,
            "\npath", path,
            "\nedge", edge)
        if (DEBUG) this.graphDb.printit()
        if (level > this.state.maxLevels) return null

        const isLeaf: boolean = (level > 0 && node.id === this.state.root.id) || path.includes(node.id)
        const disabled: boolean = (level > 0 && node.id === this.state.root.id) || path.includes(node.id)

        const nodeRenderProps = {
            node: node,
            inEdge: edge,
            data: (id: Id) => this.graphDb.getData(id)
        }

        const title = this.props.onRenderNode ?
            this.props.onRenderNode(nodeRenderProps, renderLinkTitle) :
            renderLinkTitle(nodeRenderProps)
        const edges: Array<Edge> = this.graphDb.getEdgesFor(node.id).map(id => this.graphDb.getEdge(id))
        const key = RelativityComponent.mkEntityKey(node.id, level)
        const ppath = path.concat([node.id])

        return (
            <TreeNode title={title!} key={key} isLeaf={isLeaf} disabled={disabled}>
                {
                    ((!disabled && !isLeaf) && edges && edges.length > 0) ?
                        this.renderByRole(node, edges, level + 1, ppath) :
                        null
                }
            </TreeNode>
        )
    }

    protected onSearchChange = (e) => {
        if (DEBUG) console.log("onSearchChange", e)
    }

    public componentWillReceiveProps(nextProps, nextContext): void {
        if (nextProps.entityId !== this.props.entityId ||
            nextProps.entityName !== this.props.entityName) {
            this.setState({ entityId: nextProps.entityId, entityName: nextProps.entityName },
                () => { this.getRootConnections() })
        }
    }

    public render() {
        const { style } = this.props

        this._styles = getStyles()
        this._classNames = getClassNames(this._styles, this.props.className)

        return (
            <div
                className={this._classNames.root}
                style={style}
            >
                <CommandBar
                    items={[]}
                    farItems={[
                        {
                            key: "refresh",
                            name: "Refresh",
                            icon: "Refresh",
                            onClick: this.refresh,
                        },
                    ]}
                />
                <Tree
                    className={this._classNames.tree}
                    selectable={false}
                    showLine
                    showIcon={false}
                    loadData={this.onLoadData}
                >
                    {this.state.root ? this.renderTreeNode(this.state.root) : null}
                </Tree>
            </div>
        )
    }
}

export default RelativityComponent

export function renderContact(props: NodeRenderProps) {
    const data = props.data(props.node.id)
    return (
        <EntityLink id={props.node.id} entityName={props.node.entityName}>
            {
                data ?
                    `${data.lastname}, ${data.firstname}` :
                    props.node.label
            }
        </EntityLink>
    )
}

/** Render a node using `EntityLink`. */
export function defaultNodeRenderer(props: NodeRenderProps) {
    switch (props.node.entityName) {
        case "contact":
            return renderContact(props)
        default:
            return (
                <EntityLink id={props.node.id} entityName={props.node.entityName}>
                    {props.node.label}
                </EntityLink>
            )
    }
}

/**
 * Render a title for a node (node=dynamics entity). A node
 * can have a customized renderer per node or from a general purpose render
 * function. This renderer takes into account the per node renderer only.
 */
export const renderLinkTitle = (props: NodeRenderProps) => {
    return props.node.onRender ?
        props.node.onRender(props, defaultNodeRenderer) :
        defaultNodeRenderer(props)
}

/**
 * Render the name and a small list next to it.
 */
export const renderTitle = ({ label, relationships }) => {
    const r = relationships ? relationships.join(", ") : null

    return label + (r ? ` - ${r}` : "")
}

export function renderEdgeTitle(props: EdgeTitleRenderProps): JSX.Element {
    return (
        <span>{props.label}</span>
    )
}