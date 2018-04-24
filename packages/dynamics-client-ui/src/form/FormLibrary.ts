/**
 * Utilities useful when working with form related objects.
 */

/**
 * Return true if the value is undefined or null. It does not checked
 * for "" , false or [].
 */
export function isNil(value: any): boolean {
    if (typeof value === "undefined") return true
    else if (value === null) return true
    return false
}

/** Clean a known string. This does not handle null/undefined. */
export function cleanId(value: string): string {
    return value.replace(/[{}]/g, "")
}

/**
 * Restrict a lookup to a specific FetchXml filter.
 *
 * Example filter to restrict customer lookup to accounts only: `<condition attribute=’contactid’ operator=’null’ /></filter>`
 * since contactid can only be null for accounts as contacts must have a contactid that is non-null.
 */
export function restictLookup(ctx: Xrm.FormContext, attribute: string, filterXml: string): void {
    const lkup = ctx.getControl(attribute) as Xrm.Controls.LookupControl
    if (lkup)
        lkup.addCustomFilter(filterXml)
    else
        console.log(`restrictLookup: attribute ${attribute} was not found.`)
}

/**
 * Retrieve the first LookupValue in the array of LookupValues from a LookupAttribute.
 * Error is thrown if the attribute is not a lookup. You have multile values in the lookup value
 * results for activtyparty like attributes so do *not* use this function for those attribute value types.
 */
export function getLookupValue(ctx: Xrm.FormContext, attributeName: string): Xrm.LookupValue | null {
    const lookup = ctx.getAttribute(attributeName) as Xrm.Attributes.LookupAttribute
    if (lookup.getAttributeType() !== "lookup")
        throw Error(`Attribute ${attributeName} on form is not a lookup.`)
    if (lookup) {
        const value = lookup.getValue()
        if (value && value.length > 0) return value[0]
    }
    return null
}
