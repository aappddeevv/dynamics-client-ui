/** Control panel for calendar display. */
import * as React from "react"
import { connect, Dispatch } from "react-redux"
import { css } from "office-ui-fabric-react/lib/Utilities"
import * as actions from "./redux/actions"
import { SearchActions as SA } from "../ActivitiesReader/redux/actions"
import UserSelection from "./UserSelection"
import { ActivitiesHeader, ActivitiesHeaderRow } from "../ActivitiesReader/ActivitiesHeader"
import * as menus from "../ActivitiesReader/Menus"
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot"
import { ActivityView } from "../ActivitiesReader/ActivityView"
import { IContextualMenuItem } from "office-ui-fabric-react/lib/ContextualMenu";
import { ActivityItem } from "../ActivitiesReader/datasources/datamodel"

const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")

export interface MSTP {
}

export const stateToProps = (state: any): MSTP => ({
    filter: state.filter,
})

export interface MDTP {
    [pname: string]: any
}

const dispatchToProps = (dispatch: Dispatch<any>): MDTP => {
    return {
        onSearchChange: (text) => dispatch(
            SA.changeSearchFilter(
                SA.setSearch(text))),
        ...menus.mapDispatchToProps(dispatch),
    }
}

export interface OwnProps {
    activity?: ActivityItem
    menuItems?: Array<IContextualMenuItem>
    classNames: ControlPanelClassNames
}

export interface ControlPanelClassNames {
    root: string
    tab: string
    userSelection: string
    detailDisplay: string
}

export type ControlPanelProps = OwnProps & MSTP & MDTP

// tslint:disable-next-line:variable-name
export const ControlPanel = ({ activity, classNames, menuItems, ...rest }: ControlPanelProps) => {
    // If not overridden, add standard.
    if (!menuItems) {
        const { activityTypesMenu, statusTypesMenu } =
            menus.DefaultMenuItemsByMenu(rest)
        menuItems = [activityTypesMenu!, statusTypesMenu!]
    }
    return (
        <div className={classNames.root}>
            <ActivitiesHeader className={"wasfystels.flexNone"}>
                <ActivitiesHeaderRow {...rest} menuItems={menuItems} />
            </ActivitiesHeader>
            <Pivot>styles
                <PivotItem linkText="Detail">
                    <ActivityView
                        activity={activity}
                        className={css(classNames.tab, classNames.detailDisplay)}
                    />
                </PivotItem>
                <PivotItem linkText="Users List">
                    <UserSelection
                        className={css(classNames.tab, classNames.userSelection)}
                    />
                </PivotItem>
            </Pivot>
        </div>
    )
}

export const ControlPanelR =
    connect<Partial<MSTP>, Partial<MDTP>, Partial<ControlPanelProps>>(stateToProps, dispatchToProps)(ControlPanel)

export default ControlPanelR
