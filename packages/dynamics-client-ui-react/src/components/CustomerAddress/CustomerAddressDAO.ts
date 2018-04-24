/**
 * Manage access to customer addresses. The parent of the address
 * is typically an Account or Account. Given an Account/Contact you
 * can get all the addresses via nav property Account_CustomerAddress/
 * Contact_CustomerAddress.
 */
import { Client, Id, Metadata, MetadataProvider } from "@aappddeevv/dynamics-client-ui/lib/Data"
export * from "./DataModel"
import { CustomerAddress } from "./DataModel"

/** Minimum set of attributes if you want to use it in your query. */
export const defaultAttributes = [
    "customeraddressid",
    "addressnumber",
    "addresstypecode",
    "city",
    "country",
    "county",
    "line1", "line2", "line3",
    "postalcode",
    "postofficebox",
    "primarycontactname",
    "shippingmethodcode",
    "name",
    "stateorprovince",
    "telephone1", "telephone2", "telephone3",
    "latitude", "longitude",
    "objecttypecode",
    "_parentid_value",
]

/** DAO for obtaining customeraddresses. Entity: customeraddress. */
export interface CustomerAddressDAO extends MetadataProvider {
    fetchAddressesFor<T extends CustomerAddress = CustomerAddress>(parentId: string): Promise<Array<T>>
    /** Create an address, return its "representation". Requires a parent entity name and parent id */
    create<T extends CustomerAddress = CustomerAddress>(entityName: string, parentId: Id): Promise<T>
    delete(id: Id): Promise<boolean>
    /** Save some changes to an existing address. Return void if successfully applied, a message otherwise. */
    save(id: Id, data: object): Promise<string | void>
}

export class CustomerAddressDAOImpl implements CustomerAddressDAO, MetadataProvider {
    constructor(client: Client, metadata?: Metadata) {
        this.client = client
        this.meta = metadata ? metadata : new Metadata(client)
    }
    protected meta: Metadata
    protected client: Client

    public get metadata(): Metadata { return this.meta }

    public delete = async (id: Id): Promise<boolean> => {
        return this.client.Delete("customeraddresses", id)
    }

    public save = async (id: Id, data: object): Promise<string | void> => {
        return this.client.Update("customeraddresses", id, data, false)
            .then(r => undefined)
            .catch(e => {
                console.log("Error saving customeraddress", e)
                return "Unable to save address."
            })
    }

    public create = async <T extends CustomerAddress = CustomerAddress>(entityName: string, parentId: Id): Promise<T> => {
        const esname = await this.meta.getEntitySetName(entityName)
        const payload = {
            [`parentid_${entityName}@odata.bind`]: `/${esname}(${parentId})`
        }
        return this.client.Create("customeraddresses", payload)
            .then(id => this.client.Get<T>("customeraddresses", id))
    }

    /** Fetch addresses for a given parentid regardless of parent type. */
    public fetchAddressesFor = async <T extends CustomerAddress = CustomerAddress>(parentId: string): Promise<Array<T>> => {
        const qopts = {
            FormattedValues: true,
            Filter: `_parentid_value eq ${parentId}`,
            OrderBy: ["name asc"],
        }
        return this.client.GetList<T>("customeraddresses", qopts)
            .then(r => r.List)
    }

    // I THINK THE VALUES COME BACK AS NEXT LINK WHICH MUST BE FOLLOWED. TOO HARD!
    // /**
    //  * Fetch Addresses for something that has the right nav property.
    //  * Default is for account. For contact use nav=Contact_CustomerAddress and
    //  * "contacts".
    //  */
    // public fetchAddressesByNav = async (
    //     accountId: string,
    //     nav: string = "Account_CustomerAddress",
    //     entitySet: string = "accounts",
    //     mainSelects: Array<string> = ["name"]): Promise<Array<CustomerAddress>> => {
    //     const qopts = {
    //         FormattedValues: true,
    //         Select: mainSelects,
    //         Expand: [
    //             {
    //                 Property: nav,
    //                 Select: defaultAttributes,
    //             }
    //         ]
    //     }
    //     return this.client.Get(entitySet, accountId, qopts).
    //         then(r => {
    //             // WHAT? NEED NEXT LINK? CHECK ON THIS
    //             const result = r[nav]
    //             return result ? result : []
    //         })
    // }

}

export default CustomerAddressDAO
