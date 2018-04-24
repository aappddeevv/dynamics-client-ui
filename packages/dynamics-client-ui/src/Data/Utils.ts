/** Misc data management utilities. */

/** Decent string hash. */
export function hash(str: string): number {
    var hash = 5381;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash;
}

/** Clean the id of brackets and lowercase everything. */
export function cleanId(id: string): string {
    if (typeof id === "undefined" || id === null) throw Error(`Unable to clean nil id ${id}`)
    return id.toString().replace(/[{}]/g, "").toLowerCase()
}

/** Wrap an id with {} and cap it, if needed. */
export function wrapId(id: string): string {
    return `${cleanId(id).toUpperCase()}`
}

/**
 * Simple normalization of data using a function to obtain the key
 * which is a string for the js object. js object keys can only be
 * a string|number.
 * @todo return the newer Map() object instead, keys can be anything
 */
export function normalize<T, U>(id: (t: T) => string,
    data: Array<T>,
    tx: (t: T) => U): { [id: string]: U } {
    return data.reduce((accum, t) => {
        accum[id(t)] = tx(t)
        return accum
    }, {})
}

/** Normalize with a key that accessed via a simple key lookup. */
export function normalizeWith<T>(key: string, data: Array<T>): { [id: string]: T } {
    return normalize<T, T>(t => t[key], data, (t: T) => t)
}

/**
 * Escape #, & and ' for use in odata filter queries. We *may* need to escape some
 * more characters but it's not clear yet e.g. `same_name eq ${escape(namevar)}`.
 * @see http://prasannaadavi.com/2014/06/handling-special-characters-in-odata-queries.html#.WphrCpzwYUE
 */
export function escape(v: string): string {
    return v.replace("'", "''").replace("&", "%26").replace("#", "%23")
}
