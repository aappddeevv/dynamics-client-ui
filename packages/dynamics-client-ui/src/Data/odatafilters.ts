/**
 * Simple query filters to use in a query spec.
 */

export const Prefix = "Microsoft.Dynamics.CRM"

/** pname and values (if array) will be quoted. If values is a string, not quoted. */
export function In(pname: string, values: Array<string> | string) {
  const vstr =
    Array.isArray(values) ?
      "[" + values.map(s => "'" + s + "'").join(",") + "]" :
      values
  return `${Prefix}.In(PropertyName='${pname}', PropertyValues=${vstr})`
}
