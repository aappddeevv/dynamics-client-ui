/**
 * Work with numbers.
 */

/**
 * Given a number, convert it to a string to reliably
 * obtain its precision, a whole number e.g. 1.02 returns 2.
 */
export function getPrecision(a: number): number {
    const numAsString = a.toFixed(10).replace(/0+$/g, "")
    const precision = String(numAsString).replace(".", "").length - a.toFixed().length
    return precision
}

/**
 * Convert string to number with the given precision, if provided
 * Return 0 if the string does not represent a number or its null.
 */
export function toNumber(s: string | null, precision?: number | null): number {
    if (!s) return 0
    const n = parseFloat(s)
    if (isNaN(n) || !isFinite(n)) return 0

    const p = precision || 10
    const q = Math.pow(10, p)
    return Math.round(n * q) / q
}
