/**
 * Utilities for working the data model.
 */

import * as Model from "./DataModel"
import * as moment from "moment"
export * from "./time"

import { momentDateFormat, formatDate } from "./time"

export const formattedValuePostfix = "@OData.Community.Display.V1.FormattedValue"

/** Convert an attribute name to one with a OData formatted value. */
export function toFVName(name: string): string {
    return name + formattedValuePostfix
}

/**
 * Copies object and adds DateStr attributse if corresponding Model.Audit attributes exist.
 */
export function enhanceAudit<T extends Model.Audit>(audit: T,
    format: string = momentDateFormat): T & Model.DateStr {
    const x = { ...(audit as any) }
    x.modifiedonstr = x.modifiedon ? formatDate(x.modifiedon) : null
    x.createdonstr = x.createdon ? formatDate(x.createdon) : null
    return x
}

/** Map a field name into another name. */
export type FieldMapper = (fname: string) => string

/**
 * Map a variety of standard dynamics crm odata and odata standard attribute names
 * into standardized names suitable for direct access via "object.standardized_name"
 * which is typically the original attribute name with a suffix e.g. formatted values
 * for attribute "myattribute" becomes "myattribute_fv".
 */
export const defaultMappers = {
    "OData.Community.Display.V1.FormattedValue": (fname: string) => `${fname}_fv`,
    "Microsoft.Dynamics.CRM.associatednavigationproperty": (fname: string) => `${fname}_anp`,
    "Microsoft.Dynamics.CRM.lookuplogicalname": (fname: string) => `${fname}_lln`,
}

/**
 * Map an object's properties that match the dynamics ODadata extended
 * properties into standardized fieldnames.
 */
export function mapODataArtifacts<T extends {}>(item: T,
    mappers: Record<string, FieldMapper> = defaultMappers): T {
    const addme = {}
    //console.log("BEFORE", item)
    for (let [ikey, ivalue] of Object.entries(item)) {
        // loop over mappers
        for (let [mkey, mapper] of Object.entries(mappers)) {
            const key = `${ikey}@${mkey}`
            // if property exists in item, map it
            if (item.hasOwnProperty(key))
                addme[mapper(ikey)] = item[key]
        }
    }
    //console.log("ADDS", addme)
    // had item not object error
    return { ...(item as any), ...addme }
}