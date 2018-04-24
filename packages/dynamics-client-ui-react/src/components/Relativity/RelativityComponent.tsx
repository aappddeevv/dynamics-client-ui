/**
 * RelativityComponent. Shows relationships using connections and standard
 * dynamics parent-child connections.
 */
import * as React from "react"
import { Requireable } from "prop-types"
//import cx = require("classnames")
import { css } from "office-ui-fabric-react/lib/Utilities"
import R = require("ramda")

import { SearchBox } from "office-ui-fabric-react/lib/SearchBox"
import { IconButton } from "office-ui-fabric-react/lib/Button"
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar"

const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
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
import { GraphDb } from "./graphdb"
import { FetchResult } from "./datasources"

import {
    RelativityComponentProps, RelativityComponentClassNames,
    RelativityComponentStyles,
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
    renderBy: number
    roleCategories: Array<string>
    expandedKeys: Array<string>

    [pname: string]: any
}

/**
 * Show hierarchy of nodes and edges using interesting groupings. To be
 * efficient, the data is lazily accessed as the tree is expanded, hence
 * the need for DAOs.
 *
 * @todo Seperate out the graph db from the view class.
 */
export class RelativityComponent extends React.Component<RelativityComponentProps, State> {

    private _styles: RelativityComponentStyles
    private _classNames: RelativityComponentClassNames

    constructor(props, context) {
        super(props, context)
        this.state = {
            root: null, // root node
            roleCategories: props.roleCategories || defaultRoleCategories,
            expandedKeys: [], // cache: expanded keys
            filters: [], // array of regexs
            maxLevels: props.maxLevels,
            renderBy: props.renderBy,
        }
        // misc caches not related to display state
        this.allRoles = []
        this.allRoleIds = []

        this.dataSource = props.dataSource
        this.dao = props.dao
    }

    public static contextTypes = {
        ...EntityForm.childContextTypes
    }

    private dao: RelativityDAO
    public context: DynamicsContext
    private dataSource: DataSource

    private allRoles: any[]
    private allRoleIds: any[]

    private graphDb = new GraphDb()

    public static defaultProps = {
        maxLevels: 10,
        renderBy: RenderBy.Relationship,
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
    }

    /** single or array */
    protected cacheNode = (node, replace = false) => {
        if (!node) return
        if (!Array.isArray(node)) node = [node]
        node.forEach(n => {
            const entry = this.graphDb.nodes[n.id]
            if (entry && replace) this.graphDb.nodes[n.id] = n
            else if (!entry) this.graphDb.nodes[n.id] = n
        })
    }

    /** single or array. Adds to edge cache and edgesCache */
    protected cacheEdge = (edge) => {
        if (!edge) return
        if (!Array.isArray(edge)) edge = [edge]
        edge.forEach(e => { this.graphDb.edges[e.id] = e })
        edge.forEach(e => {
            let entry = this.graphDb.edgesCache[e.source]
            if (!entry) { entry = []; this.graphDb.edgesCache[e.source] = entry }
            entry.push(e) // append to the list
        })
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
                    this.props.entityName!, entity)
                this.cacheNode(n)
                return n
            }).
            catch(e => {
                console.log("Error obtaining root entity info", this.props.entityId,
                    this.props.entityName, e)
                this.getDataError()
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
                this.cacheNode(stuff.nodes, false)
                this.cacheEdge(stuff.edges)
                return stuff
            }).
            catch(e => {
                console.log("Error obtaining graph data", e, entityId, entityName, moreProps)
                throw e
            })
    }

    protected getDataError = () => {
        this.reportError("There was an error obtaining graph data. You may want to refesh your browser.")
    }

    /**
     * Get root entity and root connections. Sets root entity state.
     */
    protected getRootConnections = () => {
        const self = this
        if (!this.props.entityId || !this.props.entityName) return
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
                        this.getDataError()
                        return null
                    })
            ))
    }

    public componentDidMount() {
        this.getRootConnections()
    }

    static extractId = (key) => key.split(":")[1]

    static mkEntityKey = (id, right) => `ent:${id}:${right}`
    static extractEntR = new RegExp("(^ent):(.+):.+$")
    static extractEnt = (key) => {
        const res = RelativityComponent.extractEntR.exec(key)
        if (res) return res[2]
        return null
    }

    static mkRelKey = (rel, parentId, right) => `rel:${rel}:${parentId}:${right}`
    static extractRelR = new RegExp("(^rel):(.+):(.+):.+$")
    static extractRel = (key) => {
        const res = RelativityComponent.extractRelR.exec(key)
        if (res) return res[2]
        return null
    }

    protected onLoadData = (treeNode) => {
        if (DEBUG) console.log("onLoadData", treeNode)
        const self = this
        const id = RelativityComponent.extractId(treeNode.props.eventKey)

        if (RelativityComponent.extractRel(treeNode.props.eventKey)) {
            // its a relationship so we don't need to expand, data's already there.
            return Promise.resolve(null)
        }
        // it's a real entity node
        const node = this.graphDb.nodes[id]

        // return if already expanded, we don't need to retrieve the same data again
        if (node.wasExpanded || treeNode.props.isLeaf) {
            this.forceUpdate()
            return Promise.resolve(node)
        }

        return this.getData(node.id, node.entityName).
            then(stuff => {
                node.wasExpanded = true
                this.forceUpdate()
                return node
            }).
            catch(e => {
                console.log("Error loading tree data on demand", node, e)
                this.getDataError()
            })
    }

    protected onExpand = (keyPath, ctx) => {
        console.log("expand", keyPath, ctx)
        //this.setState({expandedKeys: keyPath})
    }

    protected onSelect = (p, ctx) => {
        console.log("select", p, ctx)
    }

    /**
     * Render relationships then entities on the "to" side.
     * Edges should all have the "node" parameter as the "source" so that
     * all edges are node -> <some other node>.
     */
    protected renderByRole = (node, edges, level, path) => {
        // { edgeLabel: Array<Edge> }
        const byRole = R.groupBy(R.prop("label"), edges)

        const nextlevel = level + 1
        const ppath = path.concat([node])
        return Object.keys(byRole).
            sort().
            map(role => {
                // expand out Edge.target (which are nodes of course)
                const entities = R.sortBy(n => n.sortKey,
                    byRole[role].map((e: Edge) => this.graphDb.nodes[e.target]))
                const key = RelativityComponent.mkRelKey(role, node.id, level)
                const tn =
                    <TreeNode title={role} key={key} isLeaf={false} disabled={false}>
                        {
                            entities.length > 0 ?
                                entities.map(e => this.renderTreeNode(e, node, nextlevel, ppath)) :
                                null
                        }
                    </TreeNode>
                return tn
            })
    }

    /**
     * Render entities with relationship stuck in parenthesis.
     */
    protected renderByEntity = (node, edges, level, path) => {
        return edges.map(e => this.renderTreeNode(this.graphDb.nodes[e.target], node, level + 1, path))
    }

    /**
     * Given a node (domain object), generate <TreeNode> and their children.
     * This function only renders entities. Children are rendered according to the state.
     */
    protected renderTreeNode = (node, parent = null, level: number = 0, path: any[] = []) => {
        //console.log("renderTreeNode", node, parent, level, path, this.edgesCache[node.id])
        if (level > this.state.maxLevels) return null

        const isLeaf: boolean = (level > 0 && node.id === this.state.root.id) || path.includes(node.id)
        const disabled: boolean = (level > 0 && node.id === this.state.root.id) || path.includes(node.id)

        const title = renderLinkTitle({
            label: node.label,
            id: node.id,
            entityName: node.entityName
        })
        const edges = this.graphDb.edgesCache[node.id]
        const key = RelativityComponent.mkEntityKey(node.id, level)
        const ppath = path.concat([node.id])

        return (
            <TreeNode title={title} key={key} isLeaf={isLeaf} disabled={disabled}>
                {
                    ((!disabled && !isLeaf) && edges && edges.length > 0) ?
                        //this.renderByEntity(node, edges, level+1, ppath):
                        this.renderByRole(node, edges, level + 1, ppath) :
                        null
                }
            </TreeNode>
        )
    }

    protected onSearchChange = (e) => {
        console.log("onSearchChange", e)
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
                    selectable
                    showLine
                    defaultExpandedKeys={["root"]}
                    showIcon={false}
                    defaultExpandAll={true}
                    loadData={this.onLoadData}
                    onExpand={this.onExpand}
                    onselect={this.onSelect}
                >
                    {this.state.root ? this.renderTreeNode(this.state.root) : null}
                </Tree>
            </div>
        )
    }
}

export default RelativityComponent

export const renderLinkTitle = ({ label, id, entityName, disabled, more }:
    { label: string, id: string, entityName: string, disabled?: boolean, more?: any | null }) => {

    if (!more) more = null
    else if (Array.isArray(more)) more = more.join(", ")
    else if (typeof more !== "string") more = more.toString()
    if (more) more = " - " + more

    if (!id || !entityName || disabled) {
        return label + (more ? more : "")
    }
    return (
        <EntityLink id={id} entityName={entityName}>
            {label}{more ? more : null}
        </EntityLink>
    )
}

/**
 * Render the name and a small list next to it.
 */
export const renderTitle = ({ label, relationships }) => {
    const r = relationships ? relationships.join(", ") : null

    return label + (r ? ` - ${r}` : "")
}
