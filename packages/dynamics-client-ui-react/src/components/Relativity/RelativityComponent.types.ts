import { DataSource } from "./datasources"
import { RelativityDAO } from "./Data"
import { IStyle } from "office-ui-fabric-react/lib/Styling"
import { EntityFormChildProps } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { Node, Edge } from "./nodes"
import { GraphDb } from "./graphdb"

export interface EdgeTitleRenderProps {
    label: string
}

export interface NodeRenderProps {
    /** The node to render. */
    node: Node

    /**
     * The edge (in) leading to node in case you want to render
     * the node with some context from the specific edge. The edge
     * could be a connection or from a dynamics entity. It is null when
     * rendering the root.
     */
    inEdge: Edge | null

    /** Get some optional data associated with an id, node or edge. */
    data: (id: string) => any | null
}

export interface RelativityComponentProps extends Partial<EntityFormChildProps> {
    className?: string
    style?: object
    roleCategories?: Array<string>
    dataSource: DataSource
    dao: RelativityDAO
    /** Max levels to show. */
    maxLevels?: number

    /** A graph database instance. */
    graphDb?: GraphDb

    /** Called after a refresh happens. */
    onRefresh?: () => void

    /** 
     * Render a Node. The default renderer is passed in so you just
     * compose your renderer for the types you care about and pass 
     * through the rest.
     */
    onRenderNode?: IRenderFunction<NodeRenderProps>

    /** Render the edge "title". This is the string that sits beneath
     * each node and groups similar concepts together e.g. a Contact
     * has "Friends" that are other Contacts. This renders "Friends".
      */
    onRenderEdgeTitle?: IRenderFunction<EdgeTitleRenderProps>
}

export interface RelativityComponentClassNames {
    root: string
    tree: string
}

export interface RelativityComponentStyles {
    root?: IStyle
    tree?: IStyle
}