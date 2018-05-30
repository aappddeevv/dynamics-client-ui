/**
 * A repository object that helps determine privileges for changing objects. This
 * access security data directly and it does *not* appear that this is available
 * in the current client side API-argh!
 */
import { Client, ClientProvider } from "./client"
import {  Id, ToString } from "./CRMWebAPI"
import { Metadata } from "./Metadata"

// examples response
/*
{"@odata.context":"https://search1crm-prod.crm.dynamics.com/api/data/v9.0/$metadata#Microsoft.Dynamics.CRM.RetrievePrincipalAccessResponse",
"AccessRights":"ReadAccess, WriteAccess, AppendAccess, AppendToAccess, CreateAccess, DeleteAccess, ShareAccess, AssignAccess"
}
*/

/** Access rights for a user/team for a given entity. Not all entity support access rights. */
export interface AccessRights {
    ReadAccess: boolean
    WriteAccess: boolean
    AppendAccess: boolean
    AppendToAccess: boolean
    CreateAccess: boolean
    DeleteAccess: boolean
    ShareAccess: boolean
    AssignAccess: boolean
}

export const NoRights: AccessRights = {
    ReadAccess: true,
    WriteAccess: true,
    AppendAccess: true,
    AppendToAccess: true,
    CreateAccess: true,
    DeleteAccess: true,
    ShareAccess: true,
    AssignAccess: true,
}

/** Horribly inefficient way to pivot the data but rights...fix this. */
export function toAccessRights(rights: string): AccessRights {
    const x = NoRights
    x.ReadAccess = rights.includes("ReadAccess")
    x.WriteAccess = rights.includes("WriteAccess")
    x.AppendAccess = rights.includes("AppendAccess")
    x.AppendToAccess = rights.includes("AppendToAccess")
    x.CreateAccess = rights.includes("CreateAccess")
    x.ShareAccess = rights.includes("ShareAccess")
    x.AssignAccess = rights.includes("AssignAccess")
    return x
}

export class Security {
    constructor(client: Client, meta?: Metadata) {
        this.client = client
        this.meta = meta ? meta : new Metadata(client)
    }
    private client: Client
    private meta: Metadata

    /** Not all entities support access rights e.g. customeraddress. */
    public userPrinicpalAccessForRecord = async (userId: string, entityName: string, eId: Id): Promise<AccessRights> => {
        const pk = await this.meta.getPk(entityName)
        if (pk) {
            const params = {
                Target: new ToString(JSON.stringify({
                    "@odata.type": `Microsoft.Dynamics.CRM.${entityName}`,
                    [pk]: eId
                }))
            }
            return this.client.ExecuteFunction("Microsoft.Dynamics.CRM.RetrievePrincipalAccess", params, "systemusers", userId)
                .then(r => toAccessRights(r.AccessRights))
                .catch(e => {
                    console.log("Error obtaining access rights", userId, entityName, eId)
                    return NoRights
                })
        }
        else return NoRights
    }
}