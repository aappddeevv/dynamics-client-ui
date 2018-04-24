import { DataSource } from "./datasources"
import { RelativityDAO } from "./Data"
import { IStyle } from "office-ui-fabric-react/lib/Styling"

export interface RelativityComponentProps {
    className?: string
    style?: object
    roleCategories?: Array<string>
    dataSource: DataSource
    dao: RelativityDAO

    entityId?: string | null
    entityName?: string | null
}

export interface RelativityComponentClassNames {
    root: string
    tree: string
}

export interface RelativityComponentStyles {
    root?: IStyle
    tree?: IStyle
}