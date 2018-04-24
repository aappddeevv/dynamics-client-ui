import * as React from "react"
import { connect } from "react-redux"
import cx = require("classnames")
import {
    CheckBoxListUsingList, ListCheckBox, CheckBoxList, CheckBox,
} from "@aappddeevv/dynamics-client-ui/lib/Components/CheckBoxList"
const styles = require("./UserSelection.css.js")
const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
import { Actions } from "../ActivitiesReader/redux"
import { selectedOwners } from "../ActivitiesReader/redux/selectors"
import R = require("ramda")
import { Checkbox as SimpleCheckbox } from "@aappddeevv/dynamics-client-ui/lib/Components/Checkbox"

import { DefaultButton } from "office-ui-fabric-react/lib/Button"
import { OwnerFilters } from "../ActivitiesReader/redux/filter"

export interface OwnProps {
    className?: string
}

export interface MSTP {
    users: Array<any>
    selectedUsers: Array<any>
}

export interface MDTP {
    selectAllUsers: () => void
    deselectAllUsers: () => void
    selectOneUser: (a: string) => void
    deselectOneUser: (a: string) => void
    allowDisabled: () => void
    enabledOnly: () => void
}

export const mapStateToProps = (state): MSTP => ({
    users: state.filter.allOwners as Array<any>,
    selectedUsers: state.filter.owners,
})

const FA = Actions.Filter

export const mapDispatchToProps = (dispatch): MDTP => ({
    selectAllUsers: () => dispatch(FA.changeOwnersFilter(FA.owners.SET_ALL())),
    deselectAllUsers: () => dispatch(FA.changeOwnersFilter(FA.owners.CLEAR())),
    selectOneUser: (value) => dispatch(FA.changeOwnersFilter(FA.owners.ADD(value))),
    deselectOneUser: (value) => dispatch(FA.changeOwnersFilter(FA.owners.REMOVE(value))),
    allowDisabled: () => dispatch(
        FA.changeOwnersFilter(
            FA.setOwnerFilters([OwnerFilters.enabled, OwnerFilters.disabled]))),

    enabledOnly: () => dispatch(
        FA.changeOwnersFilter(
            FA.setOwnerFilters([OwnerFilters.enabled]))),
})

type AllProps = OwnProps & MSTP & MDTP

/**
 * Select users using a checbox list and a color box. Users
 * must have a id and fullname property.
 */
class View extends React.Component<AllProps, any> {

    constructor(props) {
        super(props)
        this.state = { showEnabledOnly: true }
    }

    protected sortUsers = (users: Array<any>): Array<any> =>
        R.sortBy(R.compose(R.toLower, R.prop("fullname")))(users)

    protected filterForEnabled = (users: Array<any>) => {
        if (!this.state.showEnabledOnly) return users
        else {
            return users.filter(u => {
                if (R.isNil(u.isdisabled)) return true // keep users without isdisabled property
                return !u.isdisabled
            })
        }
    }

    public render() {
        let { users } = this.props
        const {
            selectedUsers,
            className,
            selectAllUsers,
            deselectAllUsers,
            selectOneUser,
            deselectOneUser } = this.props

        const cls = cx(styles.component, fstyles.flexVertical, className)

        // map users into a format needed by checkboxlist
        users = users.map(u => ({
            ...u,
            value: u.id,
            label: u.fullname,
        }))
        // shrink users based on enabled/disabled user status

        users = this.sortUsers(this.filterForEnabled(users))

        return (
            <div className={cls} data-ctag="UserSelection">
                <div
                    className={cx(styles.commandBar, fstyles.flexNone,
                        fstyles.flexHorizontal, fstyles.flexAlignItemsCenter)}
                >
                    <DefaultButton
                        key="allowNone"
                        text="All / None"
                        menuProps={{
                            items: [
                                {
                                    key: "selectAll",
                                    name: "Select All",
                                    onClick: selectAllUsers,
                                },
                                {
                                    key: "deselectAll",
                                    name: "Deselect All",
                                    onClick: deselectAllUsers,
                                },
                            ],
                        }}
                    />
                    <SimpleCheckbox
                        className={styles.enabledOnlyCheckbox}
                        checked={this.state.showEnabledOnly}
                        title="Shrink user list but still honor selections for showing activities in the calendar."
                        label="Show just enabled users in user list"
                        onChange={checked => {
                            this.setState({ showEnabledOnly: checked })
                        }}
                    />
                </div>
                <CheckBoxListUsingList
                    data-ctag="CheckBoxList"
                    key="owners"
                    className={cx(styles.usersList, fstyles.flexAuto)}
                    options={users}
                    onChange={(value, checked) => {
                        console.log("value, checked", value, checked)
                        checked ? selectOneUser(value) : deselectOneUser(value)
                    }}
                    CheckBoxComponent={renderUser}
                    checked={selectedUsers}
                />
            </div>
        )
    }
}

export const UserSelection = connect<MSTP, MDTP, OwnProps>(mapStateToProps, mapDispatchToProps)(View)
export default UserSelection

/** Render a checkbox, name and colored circle/square. */
export function renderUser(props) {
    const { option } = props
    const color = colorForUser(option)
    return (
        <div
            className={cx(fstyles.flexHorizontal,
                fstyles.flexAlignItemsCenter,
                styles.user)}
        >
            <div
                className={cx(styles.colorMarker)}
                style={{ background: color }}
            />
            <ListCheckBox {...props} />
        </div>
    )
}

export const standardColor = "rgb(49, 116, 173)"
export const standardColorHighlighted = "#265985"

/**
 * Given a user record obtain the color from the record
 * under user.color (string or record) or return the standard color.
 */
export function colorForUser(user) {
    let color = standardColor // standard blue from bigcalendar
    if (!user) return color
    const hasColor = !!user.color
    if (hasColor && typeof user.color === "object") {
        const ucolor = user.color
        color = `rgb(${ucolor.red},${ucolor.green},${ucolor.blue})`
    } else if (hasColor && typeof user.color === "string") {
        color = user.color
    }
    return color
}

function renderSplitButtonMenu(props) {
    return (
        <DefaultButton
            className={cx(styles.filterButton, props.className)}
            key={props.key}
            text={props.name}
            menuProps={props.subMenuProps}
        />
    )
}
