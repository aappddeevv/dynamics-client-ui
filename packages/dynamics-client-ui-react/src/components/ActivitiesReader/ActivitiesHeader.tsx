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

export interface ActivitiesHeaderRowProps {
    className?: string
    onRefresh?: () => void
    menuItems?: Array<IContextualMenuItem> | ((props: any) => Array<IContextualMenuItem>)
    hideSearch?: boolean
    hideRefresh?: boolean
    hideMenu?: boolean
    /** More buttons/messages and other things to add... */
    children?: React.ReactNode | React.ReactNode[]
    isLoading?: boolean
    onSearchChange?: (t: string) => void
    menuTriggerProps?: Partial<MenuTriggerProps>
}

/**
 * Default header row that has a button trigger, contextual menu. Uses DefaultMenuItems if none are provided.
 * @param menuItems Function props=>array of menu specs. Default is DefaultMenuItems.
 * @param onSearchChange Function Text => undefined fired when search box content changes.
 */
export function ActivitiesHeaderRow(props: ActivitiesHeaderRowProps) {
    const {
        className, menuItems, onRefresh,
        hideSearch, hideRefresh, hideMenu,
        children, isLoading, menuTriggerProps,
        onSearchChange, ...rest
    } = props

    const mitems: Array<IContextualMenuItem> = R.isNil(menuItems) ?
        menus.DefaultMenuItems(rest) : (
            typeof menuItems === "function" ? menuItems(rest) : (menuItems || []))
    return (
        <div
            key="defaultActivitiesHeaderRow"
            className={cx(fstyles.flexHorizontal, className)}
            data-ctag="ActivitiesHeaderRow"
        >
            {isLoading ?
                <Spinner className={styles.headerButton} size={SpinnerSize.medium} /> :
                <MenuTrigger {...menuTriggerProps} menuItems={mitems} />
            }
            {children}
            {hideSearch ? null :
                <SearchBox
                    onChange={onSearchChange}
                    className={fstyles.flexExpandLeft}
                />
            }
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
            }
        </div>
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
