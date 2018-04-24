/** Client access to dynamics data */

import { CRMWebAPI, Config } from "./CRMWebAPI"
import { XRM } from "../Dynamics"

/**
 * The basic client type. Use this instead of CRMWebAPI directly.
 */
export type Client = CRMWebAPI

/**
 * Create a new client based on an XRM and a postfix. This function does
 * not use the discovery service and hence is synchronous. postfix should
 * have a leading and trailing slash.
 */
export function mkClient(xrm: XRM, postfix: string): Client {
    const config = { APIUrl: xrm.Utility.getGlobalContext().getClientUrl() + postfix }
    return fromConfig(config)
}

/**
 * Create a new client based on a full data API URL that you would find
 * from the discovery services or from the Developer Resources page in Dynamics.
 */
export function mkClientForURL(url: string, config?: Partial<Config>): Client {
    const combined: Config = { APIUrl: url, ...config }
    return fromConfig(combined)
}

/**
 * Create a new client based on a full Config object.
 */
export function fromConfig(config: Config): Client {
    return new CRMWebAPI(config)
}

/** Something that provides a client. */
export interface ClientProvider {
    client: Client
}
