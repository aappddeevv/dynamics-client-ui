/** 
 * A repository object that helps determine privileges for changing objects. This 
 * access security data directly and it does *not* appear that this is available
 * in the current client side API-argh!
 */

import { Client, Id, ClientProvider, Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data";

export class Security {
    constructor(client: Client, meta?: Metadata) {
        this.client = client
        this.meta = meta ? meta : new Metadata(client)
    }
    private client: Client
    private meta: Metadata

    public userPrinicpalAccessForRecord = async (userId: string, entityName: string, eid: Id): Promise<any> => {
        const pk = await this.meta.getPk(entityName)
        if (pk) {
            const params = {
                Target: JSON.stringify({
                    "@odata.type": `Microsoft.Dynamics.CRM.${entityName}`,
                    [pk]: eid
                })
            }
            return this.client.ExecuteFunction("Microsoft.Dynamics.CRM.RetrievePrinicpalAccess", params, "systemusers", userId)
        }
        else return null
    }
}