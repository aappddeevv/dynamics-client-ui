import * as React from "react"
import cx = require("classnames")
import { MenuTrigger, MenuTriggerProps } from "@aappddeevv/dynamics-client-ui/lib/Components/MenuTrigger"
import { SearchBox } from "office-ui-fabric-react/lib/SearchBox"
import { IconButton } from "office-ui-fabric-react/lib/Button"
import {
    Spinner,
    SpinnerSize
} from "office-ui-fabric-react/lib/Spinner"
import { IContextualMenuItem } from "office-ui-fabric-react/lib/ContextualMenu"
import R = require("ramda")
import * as menus from "./Menus"
const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
const styles = require("./ActivitiesHeader.css")
const cstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/common.css")
import { CommandBar, ICommandBarProps } from "office-ui-fabric-react/lib/CommandBar"

export interface ActivitiesHeaderRowProps {
    className?: string
    onRefresh?: () => void
    menuItems?: Array<IContextualMenuItem> | ((props: any) => Array<IContextualMenuItem>)
    isSearchBoxVisible?: boolean
    hideRefresh?: boolean
    hideMenu?: boolean
    /** More buttons/messages and other things to add... */
    //children?: React.ReactNode | React.ReactNode[]
    isLoading?: boolean
    onSearchChange?: (t: string) => void
    menuTriggerProps?: Partial<MenuTriggerProps>
    moreItems?: Array<IContextualMenuItem>
    commandBarProps?: Partial<ICommandBarProps>
}

export const renderSpinner = (className?: string | null) => {
    return (
        <Spinner className={className ? className : ""} size={SpinnerSize.medium}
        />
    )
}

/**
 * Default header row that has a button trigger, contextual menu. Uses DefaultMenuItems if none are provided.
 * @param menuItems Function props=>array of menu specs. Default is DefaultMenuItems.
 * @param onSearchChange Function Text => undefined fired when search box content changes.
 */
export function ActivitiesHeaderRow(props: ActivitiesHeaderRowProps) {
    const {
        className, menuItems, onRefresh,
        isSearchBoxVisible, hideRefresh, hideMenu,
        /*children, */isLoading, menuTriggerProps,
        moreItems, commandBarProps,
        onSearchChange, ...rest
    } = props

    const sbvisible = isSearchBoxVisible || true
    console.log("BLAH", props)
    const mitems: Array<IContextualMenuItem> = R.isNil(menuItems) ?
        menus.DefaultMenuItems(rest) : (
            typeof menuItems === "function" ? menuItems(rest) : (menuItems || []))

    const spinner = isLoading ?
        [{
            key: "loading",
            //onRender: () => renderSpinner(/*styles.headerButton*/)
            name: "Loading...",
            title: "Loading data from CRM server"
        }] : []
    const menu = !isLoading ?
        [{
            key: "menu",
            name: "Filters",
            title: "Filters to control what is displayed.",
            onRender: () =>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <MenuTrigger {...menuTriggerProps} menuItems={mitems} />
                    <span>Filter</span>
                </div>
        }] : []
    const refresh = !isLoading ?
        [{
            key: "refresh",
            name: "Refresh",
            title: "Force a refresh data from CRM server.",
            disabled: isLoading,
            iconProps: {
                iconName: "Refresh"
            },
            onClick: onRefresh
        }] : []

    return (
        <div
            key="defaultActivitiesHeaderRow"
            className={cx(fstyles.flexHorizontal, className)}
            data-ctag="ActivitiesHeaderRow"
        >
            <CommandBar
                className={fstyles.flexFull}
                items={[
                    ...spinner,
                    ...menu,
                    ...(moreItems ? moreItems : []),
                    ...refresh,
                ]}
                {...commandBarProps}
            />
            {/* {isLoading ?
                <Spinner className={styles.headerButton} size={SpinnerSize.medium} /> :
                <MenuTrigger {...menuTriggerProps} menuItems={mitems} />
            }
            {children}
            {hideRefresh || isLoading ? null :
                <div style={{ paddingLeft: 5, paddingRight: 3 }}>
                    <IconButton
                        onClick={onRefresh}
                        title="Refresh"
                        aria-label="Refresh"
                        aria-hidden
                        iconProps={{ iconName: "refresh" }}
                    />
                </div>
            } */}
            {!sbvisible || isLoading ? null :
                <SearchBox
                    onChange={onSearchChange}
                    className={fstyles.flexExpandLeft}
                />
            }
        </div>

        // <div
        //     key="defaultActivitiesHeaderRow"
        //     className={cx(fstyles.flexHorizontal, className)}
        //     data-ctag="ActivitiesHeaderRow"
        // >
        //     {isLoading ?
        //         <Spinner className={styles.headerButton} size={SpinnerSize.medium} /> :
        //         <MenuTrigger {...menuTriggerProps} menuItems={mitems} />
        //     }
        //     {children}
        //     {hideRefresh || isLoading ? null :
        //         <div style={{ paddingLeft: 5, paddingRight: 3 }}>
        //             <IconButton
        //                 onClick={onRefresh}
        //                 title="Refresh"
        //                 aria-label="Refresh"
        //                 aria-hidden
        //                 iconProps={{ iconName: "refresh" }}
        //             />
        //         </div>
        //     }
        //     {!sbvisible || isLoading ? null :
        //         <SearchBox
        //             onChange={onSearchChange}
        //             className={fstyles.flexExpandLeft}
        //         />
        //     }
        // </div>
    )
}

/**
 * Default header presentational component. Lays out children as rows using flex in
 * column direction. If children is an array, ensure each element has a key property.
 */
export function ActivitiesHeader({ className, children, ...rest }) {
    const cls = cx(fstyles.flexVertical, className)
    return (
        <div className={cls} data-ctag="ActivitiesHeader">
            {children}
        </div>)
}
