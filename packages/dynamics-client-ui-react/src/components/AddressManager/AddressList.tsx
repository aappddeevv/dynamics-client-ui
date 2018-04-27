import * as React from "react"
import { css } from "office-ui-fabric-react/lib/Utilities"
import {
    CheckboxVisibility,
    ColumnActionsMode,
    ConstrainMode,
    IDetailsListProps,
    DetailsListLayoutMode as LayoutMode,
    IColumn,
    ISelection,
    Selection,
    SelectionMode,
} from "office-ui-fabric-react/lib/DetailsList"
import {
    SortingState, SortableDetailsList, SortableDetailsListProps,
} from "@aappddeevv/dynamics-client-ui/lib/fabric/SortableDetailsList"
import { CustomerAddress } from "../CustomerAddress/DataModel"
import { EditorListProps } from "./AddressEditor.types"

export const defaultColumns: Array<Partial<IColumn>> = [
    {
        key: "name",
        name: "Name",
        fieldName: "name",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        isRowHeader: true,
    },
    {
        key: "line1",
        name: "Line1",
        fieldName: "line1",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
    },
    {
        key: "city",
        name: "City",
        fieldName: "city",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
    },
    {
        key: "stateorprovince",
        name: "State/Province",
        fieldName: "stateorprovince",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
    },
    {
        key: "postalcode",
        name: "Postal Code",
        fieldName: "postalcode",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
    },
    {
        key: "country",
        name: "Country",
        fieldName: "country",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
    },
]

export const defaultSortState: SortingState = {
    name: { direction: "asc", position: 0, },
}

/** Pure presentational component that displays an address list. */
export const AddressList: React.SFC<EditorListProps> = (props) => {
    return (
        <div className={css(props.className)}>
            <SortableDetailsList
                defaultSortState={props.defaultSortState ? props.defaultSortState : defaultSortState}
                selection={props.selection}
                items={props.items}
                columns={defaultColumns}
                allowSelection
                onSort={props.onSort}
                detailsListProps={{
                    selectionMode: SelectionMode.single
                }}
                {...props.sortableDetailsListProps}
            />
        </ div>
    )
}

AddressList.displayName = "AddressList"