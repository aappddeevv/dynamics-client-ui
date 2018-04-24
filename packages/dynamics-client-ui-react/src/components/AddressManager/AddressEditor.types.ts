
import { IStyle } from "office-ui-fabric-react/lib/Styling"
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { AddressListProps } from "./AddressList"
import { AddressDetailProps } from "./AddressDetail"
import { CustomerAddressDAO, CustomerAddress } from "../CustomerAddress/CustomerAddressDAO"
import { EntityFormChildProps } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { KeyAndText, Id } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { EditorSpecification, EditorProps, EditorController, EditorEntityMetadata } from "./Editor"
import { EntityDefinition, Attribute } from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"

export interface CustomerAddressE extends CustomerAddress, KeyAndText {
}

export interface AddressEditorProps extends Partial<EntityFormChildProps>, EditorProps {
    specification: EditorSpecification
    className?: string
    styles?: AddressEditorStyles
    addressRepo: CustomerAddressDAO
    controller: EditorController<CustomerAddress>

    onRenderMaster?: IRenderFunction<AddressListProps>
    onRenderDetail?: IRenderFunction<AddressDetailProps>
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
