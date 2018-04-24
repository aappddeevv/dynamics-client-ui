/**
 * View a single activity with a header showing
 * some atributes and the bottom part showing
 * the description in a vertical scroller if needed.
 * This modules has several parts you can use
 * independently.
 */
import * as React from "react"
import { connect } from "react-redux"
import cx = require("classnames")
import Lines from "@aappddeevv/dynamics-client-ui/lib/Components/Lines"
import EntityLink from "@aappddeevv/dynamics-client-ui/lib/Components/EntityLink"
import VerticalSeparator from "@aappddeevv/dynamics-client-ui/lib/Components/VerticalSeparator"
import { ActivityItem, emptyActivityItem } from "./datasources/datamodel"
const styles = require("./ActivityView.css")
const fstyles = require("@aappddeevv/dynamics-client-ui/lib/Dynamics/flexutilities.css")
import { IRenderFunction } from "office-ui-fabric-react/lib/Utilities"

// TODO: Make clickable...
export function Attachment({ className, activity, hasAttachment, attachment }: {
    activity: any
    hasAttachment: boolean
    className?: string
    attachment?: string
}) {
    const cls = cx(styles.attachment, className);
    return (
        <div className={cls}>
            {activity && hasAttachment && attachment &&
                <span>{attachment}</span>}
        </div>
    )
}

export interface DescriptionProps {
    className?: string | null
    activity?: ActivityItem | null
}

/** Pass an activity object in the target data model. */
const Description: React.SFC<DescriptionProps> = (props: DescriptionProps) => {
    const desc: string = (props.activity && props.activity.description) ?
        props.activity.description : ""
    return (
        <div
            className={cx("ttg-Description", props.className)}
            dangerouslySetInnerHTML={{ __html: desc }}
        />
    )
}

/**
 * Render an ActivityItem header or a blank one if the activity is
 * undefined or null.
 * Use as last composition in the chain as it return a default element
 * if there is no activity.
 */
export const defaultDetailHeaderSelector = (props: HeaderProps) => {
    return (
        <div className={cx(props.className)}>
            {props.activity ?
                <ActivityHeader {...props.activity!} /> :
                <BlankActivityHeader />
            }
        </div>
    )
}

/** Render an ActivityItem header. Use `missing` for any missing values. */
export const ActivityHeader = (props: ActivityItem & { missing?: string | null }) => {

    let { subject, owner, createdonstr, startstr, endstr, durationinminutes, regarding,
        statuscodestr, statecodestr, typecode, id, missing } = props

    missing = missing || "--"
    owner = owner || missing
    createdonstr = createdonstr || missing
    statecodestr = statecodestr || missing
    statuscodestr = statuscodestr || missing
    subject = subject || missing
    startstr = startstr || missing
    endstr = endstr || missing
    const durationinminutesstr = durationinminutes ? durationinminutes.toString() : missing
    regarding = regarding || missing

    const timestr = `From: ${startstr} To: ${endstr} For: ${durationinminutes ? durationinminutes : ""}${durationinminutesstr === missing ? "" : " (min)"}`

    return (
        <Lines>
            <div className={styles.activitySubject} title={subject}>
                {"Subject: "}
                {(typecode && id) ?
                    <EntityLink
                        entityName={typecode} // really entity name!
                        id={id}
                        openInNewWindow={true}
                    >
                        {subject}
                    </EntityLink> :
                    subject
                }
            </div>
            <div className={styles.activityOwner} title={owner}>
                {"Owner: "}{owner}
            </div>
            <div className={styles.activityCreatedOn} title={createdonstr}>
                {"Created On: "}{createdonstr}
            </div>
            <div title={timestr}>
                {timestr}
            </div>
            <div title={regarding}>
                {"Regarding: "}{regarding}
            </div>
            <div className={styles.activityStatus}>
                {"State: "}{statecodestr}
            </div>
        </Lines>
    )
}

/** Render a blank ActivityItem header. */
export const BlankActivityHeader = () => {
    return <ActivityHeader {...emptyActivityItem} />
}

export interface HeaderProps {
    className?: string | null
    activity?: ActivityItem | null
}

export interface ActivityViewProps {
    className?: string
    activity?: ActivityItem | null
    onHeaderRender?: IRenderFunction<HeaderProps>
    onRenderDescription?: IRenderFunction<DescriptionProps>
}

/**
 * Display attributes in a header, description in text, maybe an attachment at the bottom.
 */
export const ActivityView: React.SFC<ActivityViewProps> = (props) => {
    const hprops = {
        activity: props.activity,
        className: cx(fstyles.flexNone, styles.detailHeader),
    }
    const header = props.onHeaderRender ?
        props.onHeaderRender(hprops, defaultDetailHeaderSelector) :
        defaultDetailHeaderSelector(hprops)

    const dprops = {
        activity: props.activity,
        className: cx(styles.description, fstyles.flexAuto),
    }
    const desc = props.onRenderDescription ?
        props.onRenderDescription(dprops, Description) :
        Description(dprops)

    return (
        <div
            data-ctag="ActivityView"
            className={cx(fstyles.flexVertical, styles.component, props.className)}
        >
            {header}
            <VerticalSeparator className={fstyles.flexNone} />
            {desc}
        </div>
    )
}
