/**
 * dynamics audit attributes
 * Note that if a riviver is used on the JSON, these will probably be dates.
 */
export interface Audit {
    createdon: string | null
    createdby: string | null
    modifiedon: string | null
    modifiedby: string | null
}

export interface AuditWithDates {
    createdon: Date | null
    createdby: string | null
    modifiedon: Date | null
    modifiedby: string | null
}

/** We often want to reformat dates to a better date format than the default. */
export interface DateStr {
    createdonstr: string | null
    modifiedonstr: string | null
}

/** key,text tuples are used alot in fabric and sometimes you cannot map them. */
export interface KeyAndText {
    key: string
    text: string
}
