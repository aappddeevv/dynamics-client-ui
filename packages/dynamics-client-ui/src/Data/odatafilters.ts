/**
 * Simple query filters to use in a query spec.
 */

export const Prefix = "Microsoft.Dynamics.CRM"

/** pname will be quoted, but maybe not values. */
export function In(pname: string, values: Array<string> | string) {
  const vstr =
    Array.isArray(values) ?
      "[" + values.map(s => "'" + s + "'").join(",") + "]" :
      values
  return `${Prefix}.In(PropertyName='${pname}', PropertyValues=${vstr})`
}
