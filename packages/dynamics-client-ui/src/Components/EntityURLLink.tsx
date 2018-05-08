/** Helpers for rendering links. */

import * as React from "react"
import { XRM } from "../Dynamics/xrm"
import { EntityLink, EntityLinkRenderProps, Props as ELProps } from "./EntityLink"
import { Link as FabricLink } from "office-ui-fabric-react/lib/Link"
import {
  getXrmP, getXrmForEntity, getXrm, getURLParameter, makeOpenEntityFormURL, catchNonFatal,
} from "../Dynamics/Utils"

/**
 * Render a link trying to create a manual entity form link that opens in the same
 * browser/new tab instead of a new window or the same tab if xrm is provided. xrm comes from the
 * parent window by default so pass in your own to ensure that it finds an XRM correctly.
 * Do not rely on the default XRM if you can avoid it. Use this when you know you
 * have the entity name and id. An attempt is made to use the same appid as the current
 * page that the link is located on.
 */
export function renderEntityFormLink(ename: string, id: string, value: React.ReactNode = "Click Here",
  xrm: XRM | null = getXrm(), entityLinkProps?: Partial<ELProps>): JSX.Element {
  if (!!xrm) {
    const tryappid = getURLParameter("appid", window.parent.parent.location.search)
    const url = catchNonFatal(() => makeOpenEntityFormURL({
      entityName: ename,
      entityId: id,
      appId: tryappid ? tryappid : undefined,
      baseURL: xrm.Utility.getGlobalContext().getClientUrl(),
    }))
    return (
      <EntityLink
        {...entityLinkProps}
        id={id}
        skipOpenForm={true}
        entityName={ename}
        anchorProps={{
          target: "_blank",
          href: url,
        }}
      >
        {value}
      </EntityLink>)
  } else
    return (
      <EntityLink
        width={900}
        height={700}
        windowPosition={2}
        {...entityLinkProps}
        id={id}
        entityName={ename}
      >
        {value}
      </EntityLink>)
}

export interface EntityFormLinkProps {
  /** Entity name to open. */
  entityName: string
  /** Dynamics id of entity to open. */
  id: string
  /** Single child. We need to make this a general child thing... */
  value?: React.ReactNode
  /** Explicit Xrm Instance. */
  xrm?: XRM | null
  /** Pass through props. */
  entityLinkProps?: Partial<ELProps>
}

/**
 * EntityLink that uses a hard URL link to open a form in a new
 * browser tab and allows you to right click.
 */
export const EntityFormLink: React.SFC<EntityFormLinkProps> = (props) => {
  return renderEntityFormLink(props.entityName, props.id, props.value || props.children, props.xrm, props.entityLinkProps)
}