import * as React from "react"
import { css } from "office-ui-fabric-react/lib/Utilities"
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
import { DEBUG } from "BuildSettings"

/**
 * `makeItems` outputs are concated with the individual `*Items`. If you want control order,
 * override `makeItems`. 
 * @todo Simplify the rendering of the command bar items, its a bit verbose below.
 */
export interface ActivitiesHeaderRowProps {
    /** Outer container classname. */
    className?: string
    /** Refresh callback. */
    onRefresh?: () => void
    /** Show search box. Defaults to true. */
    showSearchBox?: boolean
    /** Show refresh button. Defaults to true. */
    showRefresh?: boolean
    /** Show the new menu. Default is true. */
    showNew?: boolean
    /** Whether the header should reflect that data is currently loading. */
    isLoading?: boolean
    /** Callback when search box changes. Provides per keystroke change notification. */
    onSearchChange?: (t: string) => void
    /** Items placed after the standard items but before the refresh button. */
    moreItems?: Array<IContextualMenuItem>
    /** New menu items. */
    newItems?: Array<IContextualMenuItem>
    /** Filter menu items. */
    filterItems?: Array<IContextualMenuItem>
    /** Props for the new item command bar button. */
    newItemProps?: Partial<IContextualMenuItem>
    /** Props for the filter item command bar button. */
    filterItemProps?: Partial<IContextualMenuItem>
    /** Command bar props */
    commandBarProps?: Partial<ICommandBarProps>
    /** Create the items from the props as computed by this function. */
    makeItems?: MenuMaker
    /** 
     * A wide variety of props necessary to create items. All of the above
     * props are removed and then "rest" are used in `makeItems`.
     */
    [pname: string]: any
}

/** You can manipulate the items by using the IContextualMenuItem's keys. */
export interface HeaderMenus {
    filterItems: Array<IContextualMenuItem>
    newItems: Array<IContextualMenuItem>
    moreItems: Array<IContextualMenuItem>
}

/** 
 * Maker signature for making menu items. 
 * @todo These should return the actual IContextMenuItem itself
 * for the command bar not just the subMenuProps.
 */
export type MenuMaker = (props: any) => HeaderMenus

/**
 * Default `itemMaker` that uses some default menu structures. This always
 * returns an empty array for `moreItems`.
 * @param props Wide variety of props used in `menus.DefaultMenuItemsByMenu`.
 */
export const defaultItemMaker: MenuMaker = (props) => {
    const m = menus.DefaultMenuItemsByMenu(props)
    const filters = [
        m.activityTypesMenu,
        m.yoursMenu,
        m.statusTypesMenu,
        m.dateRangeMenu,
    ].filter(m => m !== null) as Array<IContextualMenuItem>
    return {
        filterItems: filters,
        newItems: m.newActivityMenu ? m.newActivityMenu.subMenuProps!.items : [],
        moreItems: []
    }
}

/** Render a medium sized spinner. Not currently used. */
export const renderSpinner = (size: SpinnerSize = SpinnerSize.medium, className?: string | null) => {
    return (
        <Spinner className={className ? className : ""} size={size}
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
        className,
        makeItems, moreItems, newItems, filterItems,
        filterItemProps, newItemProps,
        showSearchBox, showRefresh, showNew,
        isLoading, commandBarProps,
        onSearchChange, onRefresh,
        ...rest
    } = props

    const sbvisible = showSearchBox || true
    if (DEBUG) console.log("ActivitiesHeaderRow.render", props)

    const m = makeItems ? makeItems(props) : defaultItemMaker(props)

    const spinner = isLoading ?
        [{
            key: "loading",
            name: "Loading...",
            title: "Loading data from CRM server"
        }] : []

    const filtermenu = !isLoading ?
        [{
            key: "menu",
            name: "Filters",
            title: "Filters to control what is displayed.",
            iconProps: { iconName: "Filter" },
            subMenuProps: {
                items: [...m.filterItems, ...(filterItems || [])]
            },
            ...filterItemProps
        }] : []

    const newmenu = !isLoading && !!showNew ?
        [{
            key: "new",
            name: "New",
            title: "Create a new item.",
            iconProps: { iconName: "Add" },
            subMenuProps: {
                items: [...m.newItems, ...(newItems || [])]
            },
            ...newItemProps,
        }] : []

    const refresh = !isLoading && !!showRefresh ?
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

    /** Compose the header with the search box until the new CommandBar is released in 2.0 */
    return (
        <div
            key="defaultActivitiesHeaderRow"
            className={css(fstyles.flexHorizontal, className)}
            data-ctag="ActivitiesHeaderRow"
        >
            <CommandBar
                className={fstyles.flexFull}
                items={[
                    ...spinner,
                    ...filtermenu,
                    ...newmenu,
                    ...(m.moreItems.concat(moreItems || [])),
                    ...refresh,
                ]}
                {...commandBarProps}
            />
            {!sbvisible || isLoading ? null :
                <SearchBox
                    onChange={onSearchChange}
                    className={fstyles.flexExpandLeft}
                />
            }
        </div>
    )
}

/**
 * Default header presentational component. Lays out children as rows using flex in
 * column direction. If children is an array, ensure each element has a key property.
 */
export function ActivitiesHeader({ className, children, ...rest }) {
    const cls = css(fstyles.flexVertical, className)
    return (
        <div className={cls} data-ctag="ActivitiesHeader">
            {children}
        </div>)
}
