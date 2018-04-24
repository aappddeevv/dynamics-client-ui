import * as React from "react"
import { XRM } from "./xrm"

/** 
 * Create a react context holding just Xrm (as type XRM)
 */
export const XrmContext = React.createContext<XRM|null>(null)
