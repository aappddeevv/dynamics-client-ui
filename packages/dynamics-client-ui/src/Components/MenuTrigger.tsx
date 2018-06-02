import * as React from "react"
const cx = require("classnames")
import { IconButton } from "office-ui-fabric-react/lib/Button"
import {
    ContextualMenu, IContextualMenuItem, DirectionalHint
} from "office-ui-fabric-react/lib/ContextualMenu"

export interface MenuTriggerProps {
    title?: string
    iconName?: string
    directionalHint?: DirectionalHint
    menuItems?: Array<IContextualMenuItem>
}

export interface State {
    isContextMenuVisible: boolean
}

/**
 * A hidable context menu with a trigger element, typically a button.
 * Uses a horiz triple dot for the trigger button by default.
 */
export class MenuTrigger extends React.Component<MenuTriggerProps, State> {
    constructor(props) {
        super(props)
        this.state = {
            isContextMenuVisible: false
        }
    }

    static defaultProps = {
        title: "Selections",
        iconName: "More",
        directionalHint: DirectionalHint.bottomLeftEdge,
    }

    render() {
        return (
            <div className={cx("ttg-MenuTrigger")}>
                <IconButton
                    onClick={this.onClick}
                    className={cx("ttg-MenuTrigger-icon", "contextualMenuTrigger")}
                    title={this.props.title}
                    aria-label={this.props.title}
                    aria-hidden
                    iconProps={{ iconName: this.props.iconName }} />
                {this.state.isContextMenuVisible &&
                    <ContextualMenu
                        target=".contextualMenuTrigger"  // could use id or set directly via ref
                        shouldFocusOnMount={false}
                        onDismiss={this.onDismiss}
                        directionalHint={this.props.directionalHint}
                        items={this.props.menuItems || []}
                    />}
            </div>
        )
    }

    onClick = () => {
        this.setState({ isContextMenuVisible: true })
    }

    onDismiss = () => {
        this.setState({ isContextMenuVisible: false })
    }

}
export default MenuTrigger
