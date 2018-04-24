import * as React from "react"
import { Store } from "redux"
import { connect } from "react-redux"
import cx = require("classnames")
const R = require("ramda")
import * as sort from "sortabular"
import { Actions } from "./redux"
import * as selectors from "./redux/selectors"
import * as menus from "./Menus"
import { CrmTable } from "@aappddeevv/dynamics-client-ui/lib/Components/CrmTable"
import { ActivitiesHeader, ActivitiesHeaderRow } from "./ActivitiesHeader"
import { ActivityView, ActivityViewProps } from "./ActivityView"
const styles = require("./styles.css")
const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
import { EntityForm, EntityFormContext } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/EntityForm"
import * as Utils from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import { setStatePromise } from "@aappddeevv/dynamics-client-ui/lib/react"
import { DEBUG } from "BuildSettings"
import {
    SortableDetailsList, SortingState,
} from "@aappddeevv/dynamics-client-ui/lib/fabric/SortableDetailsList"
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
import { ActivityItem, Id } from "./datasources/datamodel"
import { formatDate } from "@aappddeevv/dynamics-client-ui/lib/Data/time"
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"
import { Footer, FooterProps } from "./Footer"
import { ActivitiesBody } from "./ActivitiesBody"

export const defaultColumns: Array<Partial<IColumn>> = [
    {
        key: "typecodestr",
        fieldName: "typecodestr",
        name: "Type",
        columnActionsMode: ColumnActionsMode.clickable,
        maxWidth: 150,
        isResizable: true,
    },
    {
        key: "subject",
        fieldName: "subject",
        name: "Subject",
        minWidth: 250,
        maxWidth: 400,
        isRowHeader: true,
        isResizable: true,
    },
    {
        key: "start",
        fieldName: "startstr",
        name: "Start Date",
        maxWidth: 135,
        data: { sortAttribute: "start" },
        isResizable: true,
    },
    {
        key: "statuscodestr",
        fieldName: "statuscodestr",
        name: "Status",
        maxWidth: 100,
        isResizable: true,
    },
    {
        key: "createdon",
        fieldName: "createdonstr",
        name: "Created On",
        maxWidth: 135,
        data: { sortAttribute: "createdon" },
        isResizable: true,
    },
    {
        key: "modifiedon",
        fieldName: "modifiedonstr",
        name: "Modified On",
        maxWidth: 135,
        data: { sortAttribute: "modifiedon" },
        isResizable: true,
    },
]

export const defaultSortState: SortingState = {
    createdon: { direction: "desc", position: 0, },
}

/**
 * Return an object with the following
 * parameters needed for Xrm.Utilty.openEntityForm/Navigation.openForm: entityName, parameters,
 * windowOptions. You do not need id since you are creating a new activity.
 * Generally, it just needs entityName and some parameters to help fill in attributes.
 *
 * @param entityNameToCreate Name like "mail", or "letter" or "task".
 * @param props Props to derive the above parameters from.
 */
export function defaultOpenFormArgs(isUci, entityNameToCreate, { entityId, entityTypeCode, entityName }) {
    const parameters =
        !isUci ?
            ((entityNameToCreate === "annotation") ?
                {
                    pId: `{${entityId}}`,
                    pType: entityTypeCode,
                } :
                {
                    // these work on web client, but not uci
                    regardingobjectid: `{${entityId}}`,
                    regardingobjectidname: "name",
                    regardingobjecttypecode: entityName,
                }) :
            ({
                regardingobjectid: JSON.stringify({
                    id: entityId,
                    name: "Previous Record",
                    entityType: entityName,
                })
            })
    if (DEBUG) console.log("defaultOpenFormArgs",
        entityNameToCreate, entityId, entityTypeCode, entityName, parameters)
    return {
        entityName: entityNameToCreate,
        parameters,
        windowOptions: { openInNewWindow: true, width: 1000, height: 1000 }
    }
}

export interface MDTP {
    /** Only single select is allowed in the readers view. */
    onSelection: (id: string) => void
    onSearchChange: (text: string) => void
    [pname: string]: any
}

export const mapDispatchToProps = (dispatch): MDTP => {
    const props = {
        onSelection: id => dispatch(Actions.View.selectIds([id])),
        onSearchChange: (text) => dispatch(Actions.Search.changeSearchFilter(Actions.Search.setSearch(text))),
        createActivity: (entityNameToCreate, props) => dispatch(Actions.View.openForm({
            entityName: entityNameToCreate,
            regardingEntity: {
                name: "Related Entity",
                id: props.entityId,
                entityName: props.entityName,
            },
        }))
    }
    const otherParts = menus.mapDispatchToProps(dispatch)
    return { ...props, ...otherParts }
}

export interface MSTP {
    entityId: string | null
    userId: string | null
    entityName: string | null
    entityTypeCode: string | null
    data: Array<ActivityItem>
    filter: any
    selectedId: Id | null
    selectedActivity: ActivityItem | null
    isLoading: boolean
}

export const mapStateToProps = (state, props): MSTP => {
    const data = selectors.selectEntities(state)
    const selectedId = Utils.firstOrElse(selectors.selectedIds(state), null)
    const selectedActivity = selectedId ?
        Utils.firstOrElse<ActivityItem, ActivityItem | null>(data.filter(ai => ai.id === selectedId), null) :
        null
    return {
        entityId: state.view.entityId,
        userId: state.view.userId,
        entityName: state.view.entityName,
        entityTypeCode: state.view.entityTypeCode,
        filter: state.filter,
        data,
        selectedId,
        selectedActivity,
        isLoading: state.view.isLoading,
    }
}

export interface DetailProps extends ActivityViewProps {
}

export interface OwnProps {
    className?: string | null
    /** Render the footer. */
    onRenderFooter?: IRenderFunction<FooterProps>

    /** Render the detail. Default is a summary header and the description beneath it. */
    onRenderDetail?: IRenderFunction<DetailProps>

    /** Customizing this component may entail passing in unknown props. */
    [pname: string]: any

    // clean this up
    additionalHeaderControls: any
    // clean this up
    headerRows: any

    onRender?: (header: JSX.Element, body: JSX.Element, footer: JSX.Element | null, props: any) => JSX.Element
    onRenderMasterDetail?: (master: JSX.Element, detail: JSX.Element) => JSX.Element
}

type ActivitiesViewComponentProps = OwnProps & MSTP & MDTP

export interface State {
    selectedIndex: number | null
    sortedItems: Array<ActivityItem>
}

/**
 * A master-detail presentation component with a header. This
 * view requires a large amount of reference data that must be setup in the redux
 * prior to use.
 */
class ActivitiesViewComponent extends React.Component<ActivitiesViewComponentProps, State> {

    constructor(props) {
        super(props)
        this.state = {
            selectedIndex: null,
            sortedItems: props.data || []
        }
    }

    protected onActiveItemChanged = (item: ActivityItem) => {
        if (this.props.onSelection)
            this.props.onSelection(item.id)
        return setStatePromise(this, { selectedIndex: this.findSelectedIndex(item.id, this.state.sortedItems) })
    }

    protected findSelectedIndex = (id: Id, items: Array<ActivityItem>) => {
        const selectedIndex = R.findIndex(ai => ai.id === id, items)
        return selectedIndex >= 0 ? selectedIndex : null
    }

    protected onSort = (items: Array<ActivityItem>) =>
        setStatePromise(this, {
            sortedItems: items,
            selectedIndex: this.findSelectedIndex(this.props.selectedId, items)
        })

    public context: EntityFormContext
    public static contextTypes = {
        ...EntityForm.childContextTypes,
    }

    public render() {
        let {
            headerRows, additionalHeaderControls,
            selector, header, detail,
            className, data,
            onSelection, selectedId, selectedActivity,
            onRenderFooter, onRenderDetail, onRenderMasterDetail,
            ...rest } = this.props

        data = data || []
        if (!header) {
            let hRows: Array<JSX.Element> = [];
            if (R.is(Function, headerRows)) {
                //hRows = headerRows(this.withStore(rest));
                hRows = headerRows(rest);
            } else if (R.is(Array, headerRows)) {
                hRows = headerRows as Array<JSX.Element>
            } else {
                // Translate createActivity to a callback that a menu item would understand.
                let cprops: Record<string, any> = { ...this.props }
                if (cprops.createActivity) {
                    // createActivity is mapped to onNew()
                    cprops.onNew = (objecttypecode, opt, e) => cprops.createActivity(objecttypecode, cprops)
                }
                hRows = [
                    <ActivitiesHeaderRow key="headerRow" {...cprops}>
                        {additionalHeaderControls}
                    </ActivitiesHeaderRow>,
                ]
            }
            header = <ActivitiesHeader className={fstyles.flexNone}>{hRows}</ActivitiesHeader>;
        }

        const master = <SortableDetailsList
            items={data}
            defaultSortState={defaultSortState}
            columns={defaultColumns}
            allowSelection={true}
            className={cx(fstyles.flexHalf, styles.master)}
            //onSort={R.curry(this.updateSelectedIndex)(this.props.selectedId, R.__)}
            onSort={this.onSort}
            detailsListProps={{
                getKey: (e: any) => e.id,
                selectionMode: SelectionMode.single,
                constrainMode: ConstrainMode.unconstrained,
                onActiveItemChanged: this.onActiveItemChanged,
            }}
        />

        const dprops = {
            className: cx(fstyles.flexHalf, styles.detail),
            activity: selectedActivity,
        }
        detail = onRenderDetail ?
            onRenderDetail(dprops, ActivityView) :
            ActivityView(dprops)

        const body = onRenderMasterDetail ?
            onRenderMasterDetail(master, detail) :
            <ActivitiesBody className={styles.body}>
                {master}
                {detail}
            </ActivitiesBody>

        const fprops = {
            count: data.length,
            selectedIndex: this.state.selectedIndex,
            selectedActivity,
            className: styles.footer,
        }
        const footer = this.props.onRenderFooter ?
            this.props.onRenderFooter(fprops, Footer) :
            Footer(fprops)

        const cprops = {
            ["data-ctag"]: "ActivitesViewComponent",
            className: cx(fstyles.flexVertical, styles.component, className)
        }
        return this.props.onRender ?
            this.props.onRender(header, body, footer, cprops) :
            <div {...cprops}>
                {header}
                {body}
                {footer}
            </div>
    }
}

export const ActivitiesViewComponentR = connect<MSTP, MDTP, OwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(ActivitiesViewComponent)

export default ActivitiesViewComponentR
