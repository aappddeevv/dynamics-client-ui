import * as ReactDOM from "react-dom"
import * as React from "react"
import { Fabric } from "office-ui-fabric-react/lib/Fabric"
import { IStyle, mergeStyles } from "office-ui-fabric-react/lib/Styling"
import { Client, mkClient, Id, Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { EntityForm } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { getXrmP } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/getXrmP"
import { AddressEditorProps, EditorListProps, EditorDetailProps, } from "./AddressEditor.types"
import { AddressEditor } from "./AddressEditor"
import { API_POSTFIX, DEBUG } from "BuildSettings"
import { CustomerAddressDAOImpl, CustomerAddressDAO } from '../../CustomerAddress'
import { CustomerAddress } from "../CustomerAddress/DataModel"
import { Security } from "../../utilities/Security"
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
     * does not cut it for you.
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

/** Perform a dynamics search using `Xrm.Utility.lookupObjects`. */
export const performSearch = (xrm: XRM, entities: Array<string>,
    allowMultiple: boolean): PerformSearchResult => {
    // @ts-ignore: bad @types/Xrm typing
    return xrm.Utility.lookupObjects({
        allowMultiSelect: allowMultiple || false,
        entityTypes: entities
    }).then(result => {
        return result
    }, err => {
        return undefined
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

/**
 * Make a controller with some possible, but not all possible, customizations of its behavior.
 * If the "copy" from the internal "edit" buffer that is passed to save is insufficient, create a controller
 * using this function and simply overwrite `save`.
 */
export function makeController(repo: CustomerAddressDAO, directCopyProps: Array<string>) {
    const canDelete = async (item: CustomerAddress): Promise<boolean> => Promise.resolve(true)
    return {
        canDeactivate: async (item: CustomerAddress) => {
            return false
        },
        create: (context: Record<string, any>) => {
            return repo.create(context.entityName, context.parentId)
        },
        delete: async (a: CustomerAddress) =>
            canDelete(a).then(allowed => {
                return allowed ?
                    repo.delete(a.customeraddressid) :
                    Promise.resolve("Address may be in use, pre-allocated or you may not have permission.")
            }),
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
 * Runner which allows some but not all possible, customizations of the basic editing display.
 */
export function run(props: AddressEditorRunProps) {
    if (DEBUG) console.log("Calling AddressEditorRunner..run")
    getXrmP().then(xrm => {
        const client = mkClient(xrm, API_POSTFIX)
        const repo: CustomerAddressDAO = props.addressRepo || new CustomerAddressDAOImpl(client)
        const className = mergeStyles(props.className, defaultStyles, props.styles)
        const sec = new Security(client)
        const metadatap = makeEntityMetadata("customeraddress", repo.metadata)

        const x = sec.userPrinicpalAccessForRecord(xrm.Utility.getGlobalContext().getUserId(),
            "contact", xrm.Page.data.entity.getId())
        x.then(s => console.log("x", s))

        const controller: DataController<CustomerAddress> =
            props.controller ||
            (props.makeController ? props.makeController(repo) : makeController(repo, directCopyProps))

        const renderit = (target: HTMLElement, metadata: EditorEntityMetadata) => {
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
        metadatap
            .then(m => { if (props.target) renderit(props.target, m) })
            .catch(e => {
                console.log("AddressEditor: Unable to retrieve metadata", e)
            })
    })
}
