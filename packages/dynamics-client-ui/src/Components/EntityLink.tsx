/**
 * Render an anchor element that opens an entity form.
 * Uses the context to obtain Xrm variable or tries to obtain it
 * by looking at the parent namespace. An additional onClick will
 * also be called *before* opening the window. Adds "crmLink" to the
 * the classnames.
 * Props: id, entityName(singular), parameters, windowParameters,
 * openInNewWindow (boolean, default is true, added to windowParmeters if present), className.
 */

import * as React from "react"
const cx = require("classnames")
import { /*withDynamics,*/ DynamicsContext } from "../Dynamics/Dynamics"
import * as Comp from "../Dynamics/Compatibility"
import { DEBUG } from "BuildSettings"
import { XRM } from "../Dynamics"
import * as PropTypes from "prop-types"
import { IRenderFunction } from "@uifabric/utilities/lib/IRenderFunction"

export interface EntityLinkRenderProps extends
    Partial<React.AnchorHTMLAttributes<HTMLAnchorElement>> {
    //onClick?: (e: any) => void
}

export interface Props {
    /** Entity name (=logical name) */
    entityName: string

    /** Entity id. GUID, without braces. */
    id: string

    /**
     * Open in new window. This is the dyanmics parameter passed through.
     * The problem with setting this false and using openForm is that history
     * does not work correctly.
     */
    openInNewWindow?: boolean
    windowPosition?: number
    height?: number
    width?: number
    /** Handle single click. */
    onClick?: (e: any) => void

    /** Handle double click */
    onDoubleClick?: (e: any) => void

    /** Xrm if available. */
    xrm?: XRM

    /** Classname for outer div. */
    className?: string
    /**
     * Render the actual link. In that case, the value of this react class
     * is potentially calling Navigation.openForm.
     */
    onRenderLink?: IRenderFunction<EntityLinkRenderProps>
    /**
     * Some of these props may not matter because the onClick handler is set to
     * open a dynamics form via `Navigation.openForm` by default.
     */
    anchorProps?: Partial<React.AnchorHTMLAttributes<HTMLAnchorElement>>
    /**
     * Skips calling openForm. props.onClick will
     * still be called. Default is false. If true, you need to pass in href via
     * anchorProps for anything to happen.
     */
    skipOpenForm?: boolean

    /** Passed directly to Navigation.openForm. Takes precedence over this props. */
    openFormOptions?: Partial<Xrm.Navigation.EntityFormOptions>

    /** Passed directly to Navigation.openForm. Takes precedence over this props. */
    openFormParameters?: any
}

export const defaultHref = "#"

/** Default render link function. Renders an anchor tag. */
export function renderLink(props: EntityLinkRenderProps): JSX.Element {
    const allprops = { ...{ href: defaultHref }, ...props }
    const { children, ...rest } = allprops
    return (
        <a {...rest} >
            {children}
        </a>)
}

export class EntityLink extends React.Component<Props, any> {

    constructor(props: Props, context: any) {
        super(props, context)
    }

    public context: DynamicsContext

    public static contextTypes = {
        xrm: PropTypes.object,
    }

    /** Instead of a href, handle the click and open the window. */
    protected handleClick = (e: any) => {
        if (this.props.onClick) this.props.onClick(e)

        if (this.props.skipOpenForm && !!this.props.skipOpenForm) return

        const xrm: XRM = this.props.xrm || this.context.xrm || (window.parent.Xrm as XRM)
        if (!xrm) {
            if (DEBUG)
                console.log("EntityLink: No Xrm provided in props, context or window parent.")
            return
        }
        const openInNewWindow = (typeof this.props.openInNewWindow !== "undefined") ? !!this.props.openInNewWindow : true
        const height = this.props.height || 1000
        const width = this.props.width || 1000
        const entityName = this.props.entityName
        const id = this.props.id
        const windowPosition: XrmEnum.WindowPositions = this.props.windowPosition || 2
        const opts = {
            entityName,
            entityId: id ? id : undefined,
            openInNewWindow,
            height,
            width,
            windowPosition,
            ...this.props.openFormOptions,
        }
        if (DEBUG) console.log("EntityLink.handleClick: Navigation.openForm options/parameters",
            opts, this.props.openFormParameters)
        if (entityName && xrm) xrm.Navigation.openForm(opts, this.props.openFormParameters)
        else if (DEBUG) console.log("EntityLink: No entityName, id or XRM provided", entityName, id)
    }

    public render() {
        const { className, children } = this.props
        const renderProps = {
            ...this.props.anchorProps,
            className: cx("crmLink", "ttg-EntityLink", className),
            onClick: this.handleClick,
            children,
        }
        const comp = this.props.onRenderLink ?
            this.props.onRenderLink(renderProps, renderLink) :
            renderLink(renderProps)
        return comp
    }
}

export default EntityLink
