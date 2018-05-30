/**
 * Data model for working with activity/annotation items. Plus some
 * utilities for working with that data.
 */
import * as moment from "moment"
import { mapODataArtifacts } from "@aappddeevv/dynamics-client-ui/lib/Data/DataModel.Utils"

export { Id } from "@aappddeevv/dynamics-client-ui"


/** Default date format. */
export const momentDateFormat = "MM/DD/YY h:mm a";

/** Format a date returned from dynamics, which is an UTC string, using the momentDateFormat format. */
export function formatDate(dt: string | Date, format?: string | null): string {
    format = format || momentDateFormat
    return moment(dt).format(format)
}

/** Convert a number (unix time) or a string (string from dynamics web api) to a date. */
export function toDate(value: string | Date | number): Date {
    return (typeof value !== "number") ?
        moment(value).toDate() :
        moment.unix(value).toDate()
}

/**
 * Returns the same as the input keys note plus timeAdjustmentNote. Duration is assumed to be 30 min
 * if no duration is provided or no end is provided.
 *
 */
export function adjustDatesAndDuration({ start, end, actualdurationminutes, durationinminutes, defaultDuration }: {
    start: Date | string
    end?: Date | string | null
    actualdurationminutes?: number | null
    durationinminutes?: number | null
    defaultDuration?: number | null
}): {
        start: Date | null
        end: Date | null
        durationinminutes: number | null
        timeAdjustmentNote: string | null
    } {
    defaultDuration = defaultDuration || 30 // 30 min

    let s: moment.Moment = moment(start)
    let e: moment.Moment = moment(end ? end : "invalid")
    let d: moment.Duration = moment.duration(durationinminutes ? durationinminutes : undefined, "m")
    let a: moment.Duration = moment.duration(actualdurationminutes ? actualdurationminutes : undefined, "m")
    let timeAdjustmentNote = ""

    const sValid = s.isValid()
    const eValid = e.isValid()
    const dValid = durationinminutes ? true : false
    const aValid = actualdurationminutes ? actualdurationminutes : false

    if (sValid && eValid && !dValid) {
        // start and stop but no duration
        d = moment.duration(e.clone().diff(s, "m"), "m")
        timeAdjustmentNote = "derived duration"
    } else if (sValid && !eValid && dValid) {
        // start, duration but no end
        e = s.clone().add(d)
        timeAdjustmentNote = "derived end"
    } else if (sValid && eValid && dValid && e.clone().diff(s, "m") > d.asMinutes()) {
        // mismatch between diff(e-s) and duration, trust s + duration.
        // happens when "due" date is different than s+duration e.g. a task
        e = s.clone().add(d)
        timeAdjustmentNote = "diff(e-s) > duration, chose e=s+d"
    } else if (aValid && dValid && sValid && a.asMinutes() < d.asMinutes()) {
        d = a // to get return value right
        e = s.clone().add(a)
        timeAdjustmentNote = "actual < schedule minutes, using e=s+actual"
    }

    // console.log("adjust time",
    //     "\nstart", start, "\nend", end,
    //     "\ndurationinminutes", durationinminutes,
    //     "\nactualdurationinmunets", actualdurationminutes,
    //     "\ns", s.toDate(), "\ne", e.toDate(), "\nd", d.minutes())
    return {
        start: s.isValid() ? s.toDate() : null,
        end: e.isValid() ? e.toDate() : null,
        durationinminutes: dValid ? d.asMinutes() : null,
        timeAdjustmentNote,
    }
}

/** Replace newlines with <br/> elements. */
export function newlinesToHtml(str) {
    if (str) return str.replace(/\n/g, "<br />")
    return str
}

/**
 * Standardized data model for an activity item. This lso includes
 * annotations converted to an activity item.
 */
export interface ActivityItem {
    id: string
    subject: string
    description: string | null
    createdon: Date
    createdonstr: string
    /** id */
    createdby: string
    modifiedon: Date | null
    modifiedonstr: string | null
    /** id */
    modifiedby: string | null
    ownerid: string
    owner: string | null
    hasAttachment: boolean
    attachment: string | null
    mimetype: string | null
    statecode: number
    statecodestr: string
    statuscode: number
    statuscodestr: string
    start: Date | null
    startstr: string | null
    end: Date | null
    endstr: string | null
    durationinminutes: number | null
    actualdurationminutes: number | null
    /** Entity name of "content" part of activity. */
    typecode: string
    /** Schema name of typecode */
    typecodestr: string
    regarding: string | null
    context?: {
        dataSource?: string
        enhancers?: Array<string>,
    }
    originalRecord?: any
    timeAdjustmentNote?: string | null
}

export const emptyActivityItem: ActivityItem = {
    id: "<no id>", subject: "",
    owner: null,
    typecode: "",
    durationinminutes: null,
    regarding: null,
    statuscodestr: "", statecodestr: "",
    startstr: null, endstr: null,
    description: null,
    createdon: new Date(), createdby: "", createdonstr: "",
    modifiedon: null, modifiedby: null, modifiedonstr: null,
    ownerid: "",
    hasAttachment: false,
    attachment: null,
    mimetype: null,
    statecode: -1,
    statuscode: -1,
    start: null, end: null,
    actualdurationminutes: 0,
    typecodestr: "",
}


/**
 * Convert a Dynamics activity to the standard data model.
 */
export function prepActivity(w: any, dateFormat?: string | null): ActivityItem {
    const x = {
        ...mapODataArtifacts(w),
        context: {
            dataSource: w.dataSource,
        },
        id: w.activityid,
        subject: w.subject,
        description: w.description,
        createdon: toDate(w.createdon),
        createdby: w.createdby,
        modifiedon: w.modifiedon ? toDate(w.modifiedon) : null,
        modifiedby: w.modifiedby,
        ownerid: w._ownerid_value,
        owner: w["_ownerid_value@OData.Community.Display.V1.FormattedValue"],
        hasAttachment: false,
        attachment: null,
        mimetype: null,
        statecode: w.statecode,
        statecodestr: w["statecode@OData.Community.Display.V1.FormattedValue"],
        statuscode: w.statuscode,
        statuscodestr: w["statuscode@OData.Community.Display.V1.FormattedValue"],
        start: toDate(w.scheduledstart),
        end: toDate(w.scheduledend),
        durationinminutes: w.scheduleddurationminutes,
        actualdurationminutes: w.actualdurationminutes,
        typecode: w.activitytypecode,
        regarding: w["_regardingobjectid_value@OData.Community.Display.V1.FormattedValue"] ||
            null,
    }
    const adjusted = (x.start !== null && x.end !== null) ?
        adjustDatesAndDuration(x) :
        { start: null, end: null }
    //console.log("prepActivity: adjustment before w:", w, "x\n", x, "adjustments\n", adjusted, "test\n",
    //     typeof w.scheduledstart, w.scheduledstart)
    return {
        ...x,
        ...adjusted,
        createdonstr: formatDate(x.createdon),
        modifiedonstr: x.modifiedon ? formatDate(x.modifiedon, dateFormat) : null,
        startstr: adjusted.start ? formatDate(adjusted.start, dateFormat) : null,
        endstr: adjusted.end ? formatDate(adjusted.end, dateFormat) : null,
        typecodestr: w["activitytypecode@OData.Community.Display.V1.FormattedValue"] ||
            x.typecode,
    }
}

/**
 * Convert a Dynamics note (annotation) to the standard ddata model. Annotations (notes) do
 * not have dates.
 */
export function prepAnnotation(w): ActivityItem {
    const x = {
        context: {
            dataSource: w.dataSource,
        },
        id: w.annotationid,
        subject: w.subject,
        description: w.notetext,
        createdon: toDate(w.createdon),
        createdby: w.createdby,
        modifiedon: w.modifiedon ? toDate(w.modifiedon) : null,
        modifiedby: w.modifiedby,
        ownerid: w._ownerid_value,
        owner: w["_ownerid_value@OData.Community.Display.V1.FormattedValue"],
        hasAttachment: w.isDocument,
        attachment: w.filename,
        mimetype: w.mimetype,
        start: null,
        startstr: null,
        durationinminutes: 0,
        actualdurationminutes: 0,
        end: null,
        endstr: null,
        typecode: "annotation", // virtual typecode
        typecodestr: "Note", // virtual typecode
        regarding: null, // does not exist on annotation

        statecode: -1,
        statecodestr: "",
        statuscode: -1,
        statuscodestr: "",

        timeAdjustmentNote: null,
    }
    return {
        ...x,
        modifiedonstr: x.modifiedon ? formatDate(x.modifiedon) : null,
        createdonstr: formatDate(x.createdon),
    }
}
