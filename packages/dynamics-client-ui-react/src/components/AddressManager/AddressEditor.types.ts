
import { IStyle } from "office-ui-fabric-react/lib/Styling"
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { CustomerAddressDAO, CustomerAddress } from "../CustomerAddress/CustomerAddressDAO"
import { EntityFormChildProps } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { KeyAndText, Id } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { EditorSpecification, EditorProps, DataController, EditorEntityMetadata } from "./Editor"
import { EntityDefinition, Attribute } from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"
import { ISelection } from "office-ui-fabric-react/lib/utilities/selection"
import { SortingState, SortableDetailsListProps } from "@aappddeevv/dynamics-client-ui/lib/fabric"

export interface CustomerAddressE extends CustomerAddress, KeyAndText {
}

export interface EditorListProps {
    className?: string | null
    items: Array<CustomerAddress>
    selection?: ISelection
    onSort?: (items: Array<CustomerAddress>) => void
    defaultSortState?: SortingState
    sortableDetailsListProps?: SortableDetailsListProps<CustomerAddress>
}

export interface EditorDetailProps {
    className?: string | null
    entity?: CustomerAddress
    setEditing: (v: boolean) => void
    onChange: (id: string, value: any) => void
    specification: EditorSpecification
    /** Render the actual detail content. A default is provided. */
    onRenderItem?: (scalaProps: any) => React.ReactNode
}

export interface AddressEditorProps extends Partial<EntityFormChildProps>, EditorProps {
    specification: EditorSpecification
    className?: string
    styles?: AddressEditorStyles
    addressRepo: CustomerAddressDAO
    controller: DataController<CustomerAddress>

    /** Render the master part. */
    onRenderMaster?: IRenderFunction<EditorListProps>
    /** Render the entire detaila. */
    onRenderDetail?: IRenderFunction<EditorDetailProps>
}

export interface AddressEditorStyles {
    root?: IStyle
    masterDetail?: IStyle
    master?: IStyle
    detail?: IStyle
    tab?: IStyle
}

export interface AddressEditorClassNames {
    root: string
    masterDetail: string
    master: string
    detail: string
}
