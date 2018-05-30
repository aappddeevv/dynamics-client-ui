import * as ReactDOM from "react-dom"
import * as React from "react"
import { Fabric } from "office-ui-fabric-react/lib/Fabric"
import { IStyle, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { Client, mkClient, Id, cleanId } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { Metadata, Attribute, EnumAttributeTypes } from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"
import { EntityForm } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { getXrmP, getURLParameter } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import { AddressEditorProps, EditorListProps, EditorDetailProps, } from "./AddressEditor.types"
import { AddressEditor } from "./AddressEditor"
import { API_POSTFIX, DEBUG } from "BuildSettings"
import { CustomerAddressDAOImpl, CustomerAddressDAO } from '../../CustomerAddress'
import { CustomerAddress } from "../CustomerAddress/DataModel"
import { Security, AccessRights } from "@aappddeevv/dynamics-client-ui/lib/Data/Security"
import { XRM } from "@aappddeevv/dynamics-client-ui"
import {
    addEditorState, DataController, EditorEntityMetadata, PerformSearchResult,
    makeEntityMetadata, EditorSpecification, EditorProps,
} from "./Editor"
import { IResult, Ok, Err } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Result"
import R = require("ramda")
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { Omit } from "@aappddeevv/dynamics-client-ui/lib/Dynamics"

/** @todo Remove EditorProps from this interface, but keep it for the default editor. */
export interface AddressEditorRunProps {
    target?: HTMLElement | null
    /** outer div */
    styles?: IStyle
    /** outer div */
    className?: string | null

    /** Provide a client */
    client?: Client

    /** Provide a reop */
    addressRepo?: CustomerAddressDAO

    /** Provide a controller. */
    controller?: DataController<CustomerAddress>

    /** 
     * Make a controller from a repo that is either passed in (in which you should 
     * case provide a controller directly) or from a repo created by the runner.
     */
    makeController?: (addressRepo: CustomerAddressDAO) => DataController<CustomerAddress>

    /** 
     * If needed, perform a search of another entity to get a value for this entity.
     * Used in LookupAttributes, if any are present.
     */
    performSearch?: (entityName: Array<string>) => PerformSearchResult

    /** 
     * Extra props for address editor including styles, classnames, master and detail 
     * child renderers, etc. 
     */
    addressEditorProps?: Omit<AddressEditorProps, EditorProps>

    /** 
     * Render the editor yourself if providing a custom `addressEditorProps` 
     * does not cut it for you. This is wrapped in a promise because you
     * may need to asynchronously create your render function.
     */
    onRenderEditor?: IRenderFunction<Omit<AddressEditorProps, EditorProps>>
}

export const defaultStyles: IStyle = {
}

export const defaultAttributeSpecification = [
    { name: "name", position: 0 },
    { name: "line1", position: 1 },
    { name: "line2", position: 2 },
    { name: "line3", position: 2 },
    { name: "city", position: 3 },
    { name: "stateorprovince", position: 4 },
    { name: "postalcode", position: 9 },
    { name: "country", position: 5 },
    { name: "telephone1", position: 6 },
    { name: "telephone2", position: 7 },
    { name: "telephone3", position: 8 },
    { name: "postofficebox", position: 10 },
]

/** 
 * Perform a dynamics search using `Xrm.Utility.lookupObjects`.
 * Promise errors are propagated and not handled. Xrm returns
 * an err object if you try to add but have not selected anything,
 * an empty array if you hit cancel or an array of Xrm.LookupValue
 * if you selected one or more values. Map the error to an empty
 * array so that performSearch provides "seleted something" or
 * "selected" nothing semantics regardless.
 */
export const performSearch = (xrm: XRM, entities: Array<string>,
    allowMultiple: boolean): PerformSearchResult => {
    // @ts-ignore: bad @types/Xrm typing
    return xrm.Utility.lookupObjects({
        allowMultiSelect: allowMultiple || false,
        entityTypes: entities
    }).then(result => {
        if (DEBUG) console.log("AddressEditorRunner.performSearch: raw result", result)
        return result
    })
        .catch(err => {
            if (DEBUG) console.log("AddressEditorRunner.performSearch: raw result:", err)
            return []
        })
}

/** 
 * Props to directly copy from an internal buffer "edit" to the save payload.
 * Add your own to a derived list and use `makeController`.
 */
export const directCopyProps = [
    "name", "line1", "line2", "line3", "telephone1", "telephone2", "telephone3",
    "city", "stateorprovince", "country", "postofficebox", "postalcode",
    "primarycontactname", "latitude", "longitude", "shippingmethodcode",
    "addresstypecode",
]

/** Check address number. If 1 or 2, you cannot delete it. */
export const defaultCanDelete = async (item: CustomerAddress): Promise<string | void> => {
    const n = item.addressnumber
    if (n && (n === 1 || n === 2)) return `Address '${item.name}' is a reserved address.`
    return Promise.resolve()
}

/**
 * Make a controller with some possible, but not all possible, customizations of its behavior.
 * If the "copy" from the internal "edit" buffer that is passed to save is insufficient, create a controller
 * using this function and simply overwrite `save`.
 */
export function makeController(repo: CustomerAddressDAO, directCopyProps: Array<string>) {
    const canDelete = defaultCanDelete
    return {
        canDeactivate: async (item: CustomerAddress) => {
            return false
        },
        create: (context: Record<string, any>) => {
            return repo.create(context.entityName, context.parentId)
        },
        delete: async (a: CustomerAddress) => repo.delete(a.customeraddressid),
        canDelete,
        isEditable: (id?: Id) => Promise.resolve(true),
        canEdit: (attributeId: string, id?: Id) => true,
        save: (item: CustomerAddress, changed: Array<string>) => {
            if (DEBUG) console.log("controller.save", item, changed)
            if (changed.length === 0) return Promise.resolve()
            const payload = {}
            directCopyProps.forEach(n => {
                if (changed.includes(n))
                    payload[n] = item[n] // which includes undefined
            })
            const saved = repo.save(item.customeraddressid, payload)
            return saved
                .then(r => undefined)
                .catch(e => {
                    console.log("Error saving changes", e)
                    return "Unable to save changes."
                })
        },
    }
}

/** 
 * Retrieve entity metadata for customeraddress and expanding out the standard
 * attributes that are actually PickLists.
 */
export async function getEditorEntityMetadata(metadata: Metadata): Promise<EditorEntityMetadata> {
    return makeEntityMetadata("customeraddress", metadata)
        .then(m => {
            // setup what we need in an array and Promise.all them....do that soon :-)
            const addressTypeP = metadata.lookupEnumAttribute("customeraddress", "addresstypecode",
                EnumAttributeTypes.PickList)
            return addressTypeP
                .then(atp => {
                    return {
                        ...m,
                        attributesById: { ...m.attributesById, [atp!.MetadataId]: atp as Attribute },
                        attributesByName: { ...m.attributesByName, [atp!.LogicalName]: atp as Attribute },
                    }
                })
        })
}

const NAME = "AddressEditorRunner"

/**
 * Runner which allows some but not all possible, customizations of the basic editing display.
 */
export function run(props: AddressEditorRunProps) {
    if (DEBUG) console.log(`Calling ${NAME}.run`)
    getXrmP().then(xrm => {

        const data = getURLParameter("data", document.location.search)
        let params = {} as { addressEditorRunProps?: Partial<AddressEditorRunProps> }
        try {
            params = JSON.parse(data || "{}")
        } catch (e) {
            console.log(`${NAME}: Error parsing data object from url. Continuing.`, e)
        }
        props = R.mergeDeepRight(props, params.addressEditorRunProps || {}) as AddressEditorRunProps

        const client = props.client || mkClient(xrm, API_POSTFIX)
        const repo: CustomerAddressDAO = props.addressRepo || new CustomerAddressDAOImpl(client)
        const className = mergeStyles(props.className, defaultStyles, props.styles)
        const sec = new Security(client)
        const metadatap = getEditorEntityMetadata(repo.metadata)

        // todo Remove dependency on Page and rely on form context perhaps, also rely on metadata
        const entityName = xrm.Page.data.entity.getEntityName()
        const access = sec.userPrinicpalAccessForRecord(xrm.Utility.getGlobalContext().getUserId(),
            entityName, cleanId(xrm.Page.data.entity.getId()))

        const controller: DataController<CustomerAddress> =
            props.controller ||
            (props.makeController ? props.makeController(repo) : makeController(repo, directCopyProps))

        const renderit = (target: HTMLElement, metadata: EditorEntityMetadata, access: AccessRights) => {
            const Ed = addEditorState<AddressEditorProps>(AddressEditor)
            const defaultRenderEditor = (props: AddressEditorProps) => <Ed {...props} />
            const specification: EditorSpecification = {
                attributes: defaultAttributeSpecification,
                metadata,
                performSearch: props.performSearch ? props.performSearch : R.curry(performSearch)(xrm),
            }
            const renderProps = {
                specification,
                controller,
                addressRepo: repo,
                canDeleteOverride: access.DeleteAccess,
                canCreateOverride: access.CreateAccess,
                canEditOverride: access.WriteAccess,
                ...props.addressEditorProps,
            }
            return ReactDOM.render(
                <Fabric className={className}>
                    <EntityForm xrm={xrm}>
                        {
                            props.onRenderEditor ?
                                props.onRenderEditor(renderProps, defaultRenderEditor) :
                                // @ts-ignore: work in EditorProps correctly
                                defaultRenderEditor(renderProps)

                        }
                    </EntityForm>
                </Fabric>,
                target)
        }

        Promise.all([metadatap, access])
            .then(asyncs => {
                const m = asyncs[0]
                if (props.target) renderit(props.target, m, asyncs[1])
            })
            .catch(e => {
                console.log("AddressEditor: Unable to retrieve metadata", e)
            })
    })
}
