/** Combine master and detail into an editor like view. */
import * as React from "react"
import { Requireable } from "prop-types"
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar"
import {
    AddressEditorProps, AddressEditorClassNames, AddressEditorStyles, CustomerAddressE,
    EditorDetailProps, EditorListProps,
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
import { AddressList } from "./AddressList"
import { Id } from "@aappddeevv/dynamics-client-ui"
import { CustomerAddress, defaultEnhancer } from "../CustomerAddress/DataModel"
import { EntityForm, EntityFormContext } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import { setStatePromise } from "@aappddeevv/dynamics-client-ui/lib/react"
import { DEBUG } from "BuildSettings"
import { firstOrElse } from '@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils';
import * as Meta from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"
import { Maybe } from "monet"
import { AddressDetail as AddressDetailX, ScalaOption } from "AddressEditorScalaJS"
import { AttributeSpecification, EditorSpecification } from "./Editor"
import { FocusZone } from "office-ui-fabric-react/lib/FocusZone"
import { Notification } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/NotificationManager"

export type T = CustomerAddressE

export interface State {
    /** Selected address out of the master list. */
    selected: Maybe<T>
    /** Clone of selected every time selected changes--editing scratchpad. */
    buffer: Maybe<T>
    /** Changed attribute identifiers id, or logical name, etc. */
    changed: Array<string>
    /** Overall list. */
    items: Array<T>
}

export function defaultDetailRender(props: EditorDetailProps) {
    return (<AddressDetailX.Component
        {...props}
    />)
}

export function defaultMasterRender(props: EditorListProps) {
    return (<AddressList {...props} />)
}

const NAME = "AddressEditor"

export class AddressEditor extends React.Component<AddressEditorProps, State> {

    public static displayName = NAME
    private _styles: AddressEditorStyles
    private _classNames: AddressEditorClassNames

    constructor(props) {
        super(props)
        this.state = {
            items: [],
            selected: Maybe.None<T>(),
            buffer: Maybe.None<T>(),
            changed: [],
        }
        this.selection = new Selection({
            onSelectionChanged: this.onSelectionChanged,
            // only used on setItems, so useless in restricting selection
            //canSelectItem: this.canSelectItem,
        })
    }
    private selection: ISelection
    /** Sorted/filtered address list in the master view. */
    private sorted: Array<T> = []
    public context: EntityFormContext

    public static contextTypes = {
        ...EntityForm.childContextTypes
    }

    // if the list is shuffled deeper down, we need to update or selection object
    protected onListShuffle = (items: Array<T>): void => {
        this.selection.setItems(items, false)
    }

    protected message = (n: Notification) => {
        if (this.context.notifier)
            this.context.notifier.add(n)
    }

    // protected canSelectItem = (item: any): boolean => {
    //     const isBusy = this.props.isDirty || this.props.isEditing
    //     if (isBusy && 
    //         this.state.selected.map(a => a.customeraddressid === item.customeraddressid).orSome(false)) return false
    //     return true
    // }

    protected onSelectionChanged = (): void => {
        const item = firstOrElse<any, null>(this.selection.getSelection(), null)
        const selected = Maybe.fromNull<T>(item)
        this.setState({
            selected,
            buffer: selected.isSome ? Maybe.pure<T>({ ...item }) : Maybe.None(),
            changed: [],
        })
        if (DEBUG) console.log(`${NAME}.onSelectionChanged`, this.selection.getSelection())
    }

    protected onSort = (items: Array<CustomerAddressE>): void => {
        // when subcompoent sorts, update Selection object but don't clear selections
        this.selection.setItems(items, false)
    }

    protected refresh = async () => {
        return setStatePromise(this, {
            buffer: Maybe.None(),
            selected: Maybe.None(),
        }).then(() => {
            this.sorted = []
            return this.getData(this.props.entityId)
        })
    }

    protected add = async () => {
        console.log(`${NAME} adding entity`)
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
        if (DEBUG) console.log(`${NAME}: deleting address`, this.state.selected)
        const runDelete = () => this.state.selected.cata(() => Promise.resolve(),
            selected => {
                if (this.props.controller.delete) {
                    return this.props.controller.delete(selected)
                        .then(result => {
                            if (result)
                                this.message({
                                    level: "ERROR",
                                    message: `Unable to delete address '${selected.name}': ${result}.`, removeAfter: 30
                                })
                            else {
                                this.message({
                                    level: "INFO",
                                    message: `Deleted address '${selected.name}'.`, removeAfter: 10
                                })
                                return this.refresh()
                            }
                        })
                        .catch(e => {
                            this.message({
                                level: "ERROR",
                                message: `Unable to delete address '${selected.name}'.`, removeAfter: 30
                            })
                        })
                }
                else return Promise.resolve()
            })
        if(this.props.controller.canDelete && this.state.selected.isSome()) {
            const deleteAllowed = await this.props.controller.canDelete(this.state.selected.some())
            if(typeof deleteAllowed === "string") {
                // not allowed!
                this.message({
                    level: "ERROR",
                    message: deleteAllowed as string,
                    removeAfter: 10,
                })
                return Promise.resolve()
            }
        } 
        return runDelete()
    }

    protected disableSelection = () => {
        this.selection.setChangeEvents(false, false)
    }

    protected enableSelection = () => {
        this.selection.setChangeEvents(true, false)
    }

    /** Reset editing flags from parent component--causes up to 2 renders. */
    protected resetEditingFlags = () => {
        this.props.setDirty(false)
        this.props.setEditing(false)
    }

    /** Reset buffer to copy of selected or None. */
    protected resetBuffer = () => {
        this.setState({
            buffer: this.state.selected.map(a => ({ ...a }))
        })
    }

    protected save = () => {
        console.log(`${NAME}.save`)
        if (this.state.buffer.isNone() || this.state.changed.length === 0) return
        // we have a buffer
        return this.props.controller.save(this.state.buffer.some(), this.state.changed)
            .then(result => {
                if (result) {
                    this.message({ level: "ERROR", message: result, removeAfter: 30 })
                }
                else {
                    this.message({ level: "INFO", message: "Saved changes.", removeAfter: 10 })
                    this.resetEditingFlags()
                    this.refresh()
                }
            })
    }

    /**
     * Handle a change in an attribute of the entity being edited. Updates
     * buffer and sets dirty if its not already set.
     */
    protected handleChange = (id: string, value: any): void => {
        if (DEBUG) console.log(`${NAME}.handleChange: id: `, id, "value: ", value)
        this.setState({
            buffer: this.state.buffer.map(b => ({ ...b, [id]: value }))
                // @ts-ignore: buffer is copy and more!, actually this should never happen!
                .orElse(Maybe.pure<T>({ [id]: value })),
            changed: [id, ...this.state.changed]
        }, () => {
            console.log("updated buffer is", this.state.buffer, this.state.changed)
        })
        if (!this.props.isDirty) this.props.setDirty(true)
    }

    protected discard = () => {
        console.log(`${NAME}: discard changes`)
        this.resetEditingFlags()
        this.resetBuffer()
    }

    public componentDidMount() {
        this.getData(this.props.entityId)
    }

    public componentWillReceiveProps(nextProps: AddressEditorProps, nextState: State) {
        if (nextProps.entityId !== this.props.entityId)
            this.getData(nextProps.entityId)
        if(nextProps.isDirty || nextProps.isEditing) this.disableSelection()
            else this.enableSelection()
    }

    protected getData = async (entityId?: Id | null): Promise<void> => {
        if (entityId && this.props.addressRepo) {
            return this.props.addressRepo.fetchAddressesFor(entityId)
                .then(addresses => {
                    const enriched = addresses.map(defaultEnhancer)
                    if (DEBUG) console.log(`${NAME}: Addresses`, addresses, enriched)
                    return setStatePromise(this,
                        {
                            items: enriched
                        }).then(() => {
                            this.onSelectionChanged()
                        })
                })
                .catch(e => {
                    if (DEBUG) console.log(`${NAME}: Error fetching addresses`, e)
                    this.message({ level: "ERROR", message: "Unable to refresh addresses", removeAfter: 10 })
                })
        }
        return Promise.resolve()
    }

    public render() {
        this._styles = getStyles(this.props.styles)
        this._classNames = getClassNames(this._styles, this.props.className)
        const hasSelection = this.selection.getSelectedCount() > 0
        const isEditing = this.props.isEditing
        const isDirty = this.props.isDirty || this.state.changed.length > 0
        const canEdit = !isEditing && !isDirty
        const canCreate = !!this.props.controller.create
        const canDelete =
            !!this.state.selected &&
            !!this.props.controller.canDelete &&
            !!this.props.controller.delete &&
            !isDirty &&
            !isEditing

        const detailProps = {
            specification: this.props.specification,
            setEditing: this.props.setEditing,
            onChange: this.handleChange,
            entity:
                (hasSelection ?
                    this.state.buffer.cata<CustomerAddressE | undefined>(() => undefined, e => e) :
                    undefined
                ),
            className: this._classNames.detail,
        }
        const masterProps = {
            selection: this.selection,
            items: this.state.items,
            className: this._classNames.master,
            onSort: this.onListShuffle,
        }

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
                            disabled: !(isEditing || isDirty),
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
                            disabled: !canDelete,
                            onClick: () => this.delete()

                        },
                        {
                            key: "discard",
                            name: "Discard",
                            disabled: !isDirty,
                            icon: "Undo",
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
                    {
                        this.props.onRenderMaster ?
                            this.props.onRenderMaster(masterProps, defaultMasterRender) :
                            defaultMasterRender(masterProps)
                    }
                    {
                        this.props.onRenderDetail ?
                            this.props.onRenderDetail(detailProps, defaultDetailRender) :
                            defaultDetailRender(detailProps)
                    }
                </div>
            </FocusZone >
        )
    }
}