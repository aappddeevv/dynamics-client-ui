import * as React from "react"
import * as ReactDOM from "react-dom"
import { Fabric } from "office-ui-fabric-react/lib/Fabric"
import { IStyle, mergeStyles } from "office-ui-fabric-react/lib/Styling"

import { Client, mkClient, Id, Metadata } from "@aappddeevv/dynamics-client-ui"
import { normalizeWith } from "@aappddeevv/dynamics-client-ui/lib/Data/Utils"
import { EntityForm } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { getXrmP } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/getXrmP"
import { AddressEditorProps } from "./AddressEditor.types"
import { AddressEditor } from "./AddressEditor"
import { API_POSTFIX, DEBUG } from "BuildSettings"
import { CustomerAddressDAOImpl } from '../../CustomerAddress'
import { CustomerAddress } from "../CustomerAddress/DataModel"
import { Security } from "../../utilities/Security"
import {
    addEditorState, EditorController, EditorEntityMetadata, PerformSearchResult,
} from "./Editor"
import { test } from "AddressEditorScalaJS"
import "@aappddeevv/dynamics-client-ui/lib/fabric/ensureIcons"
import { IResult, Ok, Err } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Result"

export interface AddressManagerRunnerProps {
    target?: HTMLElement | null
    /** Props for address editor including styles, classnames, etc. */
    addressEditorProps?: AddressEditorProps
    /** outer div */
    styles?: IStyle
    /** outer div */
    className?: string | null
}

export const defaultStyles: IStyle = {
}

export const defaultAttributeSpecification = [
    { name: "name", position: 0 },
    { name: "line1", position: 1 },
    { name: "line2", position: 2 },
    { name: "city", position: 3 },
    { name: "stateorprovince", position: 4 },
    { name: "postalcode", position: 9 },
    { name: "country", position: 5 },
    { name: "telephone1", position: 6 },
    { name: "telephone2", position: 7 },
    { name: "telephone3", position: 8 },
    { name: "postofficebox", position: 10 },
]

export function run(props: AddressManagerRunnerProps) {
    test()
    getXrmP().then(xrm => {
        const client = mkClient(xrm, API_POSTFIX)
        const repo = new CustomerAddressDAOImpl(client)
        const className = mergeStyles(props.className, defaultStyles, props.styles)
        const sec = new Security(client)
        const metadata = repo.metadata.getMetadata("customeraddress")
            .then(ed => {
                return repo.metadata.getAttributes("customeraddress")
                    .then(attrs => ({
                        entity: ed!,
                        attributes: attrs,
                        attributesById: normalizeWith("MetadataId", attrs),
                        attributesByName: normalizeWith("LogicalName", attrs),
                    }))
            })
        const x = sec.userPrinicpalAccessForRecord(xrm.Utility.getGlobalContext().getUserId(),
            "contact", xrm.Page.data.entity.getId())
        x.then(s => console.log("x", s))

        /** indexed by entityid-attributeid. */
        let changes: Record<string, Record<string, any>> = {}

        const controller: EditorController<CustomerAddress> = {
            canDeactivate: async (item: CustomerAddress) => {
                return false
            },
            create: (context: Record<string, any>) => {
                return repo.create(context.entityName, context.parentId)
            },
            delete: async (a: CustomerAddress) =>
                repo.delete(a.customeraddressid).then(r => r ? undefined : "Unable to delete."),
            canDelete: async (item: CustomerAddress): Promise<boolean> => {
                return Math.random() > 0.5
            },
            isEditable: (id?: Id) => Promise.resolve(true),
            canEdit: (attributeId: string, id?: Id) => true,
            save: (id?: Id) => {
                console.log("save called")
                if (Object.keys(changes).length === 0) return Promise.resolve()
                // save old exsiting changes in case we need to restore
                const existing = { ...changes }
                const saves = Object.entries(changes).map(p => {
                    return repo.save(p[0], p[1])
                })
                return Promise.all(saves)
                    .then(r => undefined)
                    .catch(e => {
                        changes = existing
                        return "Error saving changes."
                    })
            },
            onChange: async (id: Id, attributeId: string, newValue: any): Promise<string | void> => {
                console.log("attribute changed", attributeId, newValue)
                const existing = changes[id]
                if (!existing) changes[id] = { [attributeId]: newValue }
                else changes[id][attributeId] = newValue
                Promise.resolve()
            },
            hasChanges: (id?: Id) => {
                if (changes.hasOwnProperty(id)) return true
                return Object.keys(changes).length > 0
            },
            resetChanges: (id?: Id) => {
                if (id) delete changes[id]
                else changes = {}
            }
        }

        const performSearch = (entities: Array<string>, allowMultiple: boolean = false): PerformSearchResult => {
            return xrm.Utility.lookupObjects({
                allowMultiSelect: allowMultiple || false,
                entityTypes: entities
            }).then(result => {
                return result
            }, err => {
                return undefined
            })
        }

        const renderit = (target: HTMLElement, metadata: EditorEntityMetadata) => {
            const Ed = addEditorState<AddressEditorProps>(AddressEditor)
            return ReactDOM.render(
                <Fabric className={className}>
                    <EntityForm xrm={xrm}>
                        <Ed
                            specification={{
                                attributes: defaultAttributeSpecification,
                                metadata,
                                performSearch,
                            }}
                            controller={controller}
                            addressRepo={repo}
                            {...props.addressEditorProps}
                        />
                    </EntityForm>
                </Fabric>,
                target)
        }
        metadata.then(m => { if (props.target) renderit(props.target, m) })
    })
}
