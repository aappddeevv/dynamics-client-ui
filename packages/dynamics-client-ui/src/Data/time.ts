import * as moment from "moment"

/** Standardized time format for moment. */
export const momentDateFormat = "MM/DD/YY h:mm:ss a"

/** Format a date using momentDateFormat. */
export function formatDate(dt: string | Date) {
    return moment(dt).format(momentDateFormat)
}
