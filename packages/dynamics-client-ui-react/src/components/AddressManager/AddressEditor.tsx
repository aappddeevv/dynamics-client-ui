/** Combine master and detail into an editor like view. */
import * as React from "react"

import { CommandBar } from "office-ui-fabric-react/lib/CommandBar"
import {
    AddressEditorProps, AddressEditorClassNames, AddressEditorStyles, CustomerAddressE,
} from "./AddressEditor.types"
import {
    ColumnActionsMode,
    ConstrainMode,
    IDetailsListProps,
    DetailsListLayoutMode,
    IColumn,
    ISelection,
    Selection,
    SelectionMode,
} from "office-ui-fabric-react/lib/DetailsList"
import { getStyles } from "./AddressEditor.styles"
import { getClassNames } from "./AddressEditor.classNames"
import { AddressDetail } from "./AddressDetail"
import { AddressList } from "./AddressList"
import { Id } from "@aappddeevv/dynamics-client-ui"
import { CustomerAddress, defaultEnhancer } from "../CustomerAddress/DataModel"
import { EntityForm } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { setStatePromise } from "@aappddeevv/dynamics-client-ui/lib/react"
import { DEBUG } from "BuildSettings"
import { firstOrElse } from '@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils';
import * as Meta from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"
import { Maybe } from "monet"
import { AddressDetail as AddressDetailX } from "AddressEditorScalaJS"
import { AttributeSpecification, EditorSpecification } from "./Editor"
import { FocusZone } from "office-ui-fabric-react/lib/FocusZone"

export type T = CustomerAddressE

export interface State {
    /** Selected address out of the master list*/
    selected: Maybe<T>
    /** Overall list. */
    items: Array<T>
    /**
     * Changes registered by the individual attribute controls. Since the input
     * entity is usually not the same structure as the data structure needed
     * to change the entity, we keep attribute->newvalue pairs indexed by attribute.
     */
    changes: Record<string, any>
}

export class AddressEditor extends React.Component<AddressEditorProps, State> {

    private _styles: AddressEditorStyles
    private _classNames: AddressEditorClassNames

    constructor(props: AddressEditorProps) {
        super(props)
        this.state = {
            items: [],
            selected: Maybe.None(),
            changes: {},
        }
        this.selection = new Selection({
            onSelectionChanged: this.onSelectionChanged,
            canSelectItem: this.canSelectItem,
        })
    }
    private selection: ISelection
    /** Sorted/filtered address list in the master view. */
    private sorted: Array<CustomerAddress> = []

    protected discardChanges = () => {
        this.setState({ changes: {} })
    }

    protected canSelectItem = (item: any): boolean => {
        return !(this.props.isDirty || this.props.isEditing)
    }

    protected onSelectionChanged = (): void => {
        this.setState({
            selected: Maybe.fromNull<T>(firstOrElse<any, null>(this.selection.getSelection(), null))
        })
    }

    protected onSort = (items: Array<CustomerAddressE>): void => {
        this.selection.setItems(items, false)
    }

    protected refresh = async () => {
        return setStatePromise(this, {
            addresses: [],
            selectedAddress: null,
            newAddress: null,
            isDirty: false,
        }).then(() => {
            this.sorted = []
            return this.getData(this.props.entityId)
        })
    }

    protected add = async () => {
        console.log("adding entity")
        const ctx = {
            entityName: this.props.entityName,
            parentId: this.props.entityId
        }
        const newEntity = await this.props.controller.create!(ctx)
        await this.refresh()
        // find newEntity and select it
        const selected = this.state.items
            .find(e => e.customeraddressid === newEntity.customeraddressid)
        if (selected) {
            this.selection.setKeySelected(selected.customeraddressid, true, false)
            //return setStatePromise(this, { selected })
        }
        else return Promise.resolve()
    }

    protected delete = async () => {
        console.log("deleting address", this.state.selected)
        this.state.selected.cata(() => Promise.resolve(),
            selected => {
                return this.props.controller.delete!(selected)
                    .then(() => {
                        return this.refresh()
                    })
            })
    }

    protected save = async () => {
        console.log("saving address")
    }

    protected discard = () => {
        console.log("discard changes")
    }

    public componentDidMount() {
        this.getData(this.props.entityId)
    }

    public componentWillReceiveProps(nextProps: AddressEditorProps, nextState: State) {
        if (nextProps.entityId !== this.props.entityId)
            this.getData(nextProps.entityId)
    }

    protected getData = async (entityId?: Id | null): Promise<void> => {
        if (entityId && this.props.addressRepo) {
            return this.props.addressRepo.fetchAddressesFor(entityId)
                .then(addresses => {
                    const enriched = addresses.map(defaultEnhancer)
                    if (DEBUG) console.log("Addresses", addresses, enriched)
                    return setStatePromise(this,
                        {
                            items: enriched
                        }).then(() => { })
                })
        }
        return Promise.resolve()
    }

    public render() {
        this._styles = getStyles(this.props.styles)
        this._classNames = getClassNames(this._styles, this.props.className)
        const isEditing = this.props.isEditing
        const isDirty = this.props.isDirty || this.props.controller.hasChanges()
        const canEdit = !isEditing && !isDirty
        const canCreate = !!this.props.controller.create
        return (
            <FocusZone
                // @ts-ignore
                handleTabKey={true}
                className={this._classNames.root}
                disabled={true}
            >
                <CommandBar
                    items={[
                        {
                            key: "Save",
                            name: "Save",
                            icon: "Save",
                            disabled: !isEditing,
                            onClick: () => { this.save() }

                        },
                        {
                            key: "new",
                            name: "New",
                            icon: "Add",
                            disabled: canCreate && !canEdit,
                            onClick: () => this.add()
                        },
                        {
                            // no deactivate?
                            key: "delete",
                            name: "Delete",
                            icon: "Delete",
                            disabled: !!!this.state.selected ||
                                (!!!this.props.controller.canDelete &&
                                    !!!this.props.controller.delete),
                            onClick: () => this.delete()

                        },
                        {
                            key: "discard",
                            name: "Discard",
                            disabled: !isDirty,
                            onClick: () => this.discard(),
                        },
                        {
                            key: "refresh",
                            name: "Refresh",
                            icon: "Refresh",
                            disabled: isEditing,
                            onClick: () => this.refresh(),
                        },
                    ]}
                    farItems={[
                        {
                            name: `# addresses: ${this.state.items.length}`,
                            key: "counter",
                        }
                    ]}
                />
                <div className={this._classNames.masterDetail}>
                    <AddressList
                        selection={this.selection}
                        addresses={this.state.items}
                        className={this._classNames.master}
                    />
                    {false &&
                        <AddressDetail
                            setEditing={this.props.setEditing}
                            setDirty={this.props.setDirty}
                            entity={this.state.selected}
                            className={this._classNames.detail}
                        />
                    }
                    {true &&
                        <AddressDetailX.make
                            specification={this.props.specification}
                            setEditing={this.props.setEditing}
                            setDirty={this.props.setDirty}
                            entity={
                                this.state.selected
                                    .cata<CustomerAddressE | null>(() => null, e => e)
                            }
                            className={this._classNames.detail}
                        />
                    }
                </div>
            </FocusZone >
        )
    }
}