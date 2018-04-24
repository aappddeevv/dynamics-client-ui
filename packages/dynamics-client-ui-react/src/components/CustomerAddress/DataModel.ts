import { KeyAndText } from '@aappddeevv/dynamics-client-ui/lib/Data';


/**
 * Default set of dynamics customeraddress attributes. 
 * addressnumber 1 and 2 are automatically created and may be empty. 
* There are always at least two addresses created for accounts and contacts.
* addressnumber 3 may have data depending on how you loaded customeraddress data
* and were not careful about updating 1 & 2 first before "creating" 3.
 */
export interface CustomerAddress {
    customeraddressid: string
    addressnumber: number | null
    name: string | null
    /** Bill To, Ship To, its the OptionSet numerical value. */
    addresstypecode: number | null
    city: string | null
    country: string | null
    county: string | null
    line1: string | null
    line2: string | null
    line3: string | null
    postalcode: string | null
    postofficebox: string | null
    primarycontactname: string | null
    shippingmethodcode: number | null
    stateorprovince: string | null
    telephone1: string | null
    telephone2: string | null
    telephone3: string | null
    latitude: number | null
    longitude: number | null
    /** Typecode that this address is linked to, uses org specific number. */
    objecttypecode: number
    /** Linked to parentid_account, parentid_contact nav property. */
    _parentid_value: string
}

/** A null address with customeraddressid = "_NULL_". */
export const NullCustomerAddress = {
    customeraddressid: "_NULL_",
    addressnumber: -1,
    name: null,
    addresstypecode: null,
    city: null,
    country: null,
    county: null,
    line1: null,
    line2: null,
    line3: null,
    postalcode: null,
    postofficebox: null,
    primarycontactname: null,
    shippingmethodcode: null,
    stateorprovince: null,
    telephone1: null,
    telephone2: null,
    telephone3: null,
    latitude: null,
    longitude: null,
    objecttypecode: -1,
    _parent_id_value: "_NULL_",
}

/** If name is blank, return a fake name as best as possible, otherwise return name. */
export function fakeName(a: CustomerAddress): string {
    if (a.name) return a.name
    const n = a.addressnumber
    if (a.line1) return `unnamed ${n} @ ${a.line1}`
    if (a.city) return `unnamed ${n} @ ${a.city}`
    if (a.stateorprovince) return `address ${n} @ ${a.stateorprovince}`
    return `no name - ${a.addressnumber}`
}

export function isBlank(a: CustomerAddress): boolean {
    if (!a.name && !a.city && !a.country && !a.county && !a.line1 &&
        !a.line2 && !a.line3 && !a.postalcode && !a.postofficebox && !a.primarycontactname &&
        !a.stateorprovince && !a.telephone1 && !a.telephone2 && !a.telephone3) return true
    return false
}

/** Add key and text from a standard customer address. Use fakeName if there is no name. */
export const defaultEnhancer = <T extends CustomerAddress>(addr: T): T & KeyAndText => {
    const n = addr.name || fakeName(addr)
    return {
        ...(addr as any),
        name: n,
        key: addr.customeraddressid,
        text: n,
    }
}