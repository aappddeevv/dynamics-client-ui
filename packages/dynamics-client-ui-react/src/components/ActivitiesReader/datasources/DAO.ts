/**
 * Data support for basic ActivitiesViewComponent.
 */
import { Client, QueryOptions } from "@aappddeevv/dynamics-client-ui/lib/Data"
import {
    ActivityItem,
} from "./datamodel"
import { DEBUG } from "BuildSettings"

/**
 * Given an entity (singular) name, return the nav properties needed
 * to obtain activitypoiniters entities. You need these to initialize
 * the "regarding" data source.
 */
export const navPropertyMapping = {
    contact: "Contact_ActivityPointers",
    account: "Account_ActivityPointers",
    opportunity: "Opportunity_ActivityPointers",
}

/** Hack for CRMWebAPI ! */
function ToString(arg) {
    this.toString = () => arg
}

/** Rollup type for the Rollup action. */
export enum RollupType {
    /** Only directly related. */
    None = "Microsoft.Dynamics.CRM.RollupType'None'", // 0
    /** Parent record and child only. */
    Related = "Microsoft.Dynamics.CRM.RollupType'Related'", // 1
    /** Parent record and all descendents. */
    Extended = "Microsoft.Dynamics.CRM.RollupType'Extended'", // 2
}

/**
 * Attributes to retrieve for an activity.
 */
export const defaultActivityAttributes = [
    "activityid",
    "subject",
    "description",
    "createdon",
    "createdby",
    "modifiedon",
    "modifiedby",
    "ownerid",
    "statecode",
    "statuscode",
    "scheduledstart",
    "scheduledend",
    "scheduleddurationminutes",
    "actualdurationminutes",
    "activitytypecode",
]

/**
 * Default attributes to retrieve for a user.
 * isdisabeld: 1 => disabled, 0 => not disabled
 */
export const defaultUserAttributes = [
    "firstname", "lastname", "fullname", "isdisabled",
    "nickname", "systemuserid", "accessmode",
]

export interface Props1 extends QueryOptions {
    dropIfPartyDeleted?: boolean
    participationtypemask?: Array<number>
    nav: string
    navSelects?: Array<string>
}

/**
 * Data access support for activity related views. Nearly all methods
 * propagate any exceptions so callers must handle them. The DAO does not
 * hold any state (DAOs should be stateless in general).
 */
export class DAO {

    constructor(client: Client) {
        this.client = client
    }
    private client: Client

    /**
     * Get entities (and formatted values) from Connections that have a To (record2) of toId. Uses
     * a two pull model to retrieve. If you are not interested in filtering the connections via
     * navigation properties that you can access or through extractIds, you can use a much simpler query.
     * @param toId The target i on the To: side of the connection.
     * @param entity Entity name, not Entity Set name! e.g. contact not contacts.
     * @param extractIds Function array connection => array id (map function). Default is to select record1id.
     * @param getEntityFromId Function id => Promise(entity).
     * @param entitySelects Entity attributes to select via the navigation property. Default is all attributes.
     * @param connectionsFilters Optional array of filters to add to Connections fetch via CrmWebAPI.QueryOpts.Filter.
     * @param connectionsSelects Selects. Must include whatever is needed to return an id using extractIds. Default is record1id.
     */
    public getEntityUsingConnectionsTo = async (toId: string, entity: string,
        getEntityFromId: (id: string) => Promise<any>,
        options: QueryOptions & {
            extractIds?: (e: any) => Array<string>
            entitySelects?: Array<string>
            entityFilters?: Array<string>
            connectionsFilter?: Array<string>
            connectionsSelects?: Array<string>
        } = {}) => {
        const toIdFilter = `_record2id_value eq ${toId}`
        const navProperty = `record1id_${entity}`
        const _extractIds = options.extractIds ||
            (connections => connections.map(conn => conn._record1id_value));
        const qopts = {
            Select: options.connectionsSelects ? options.connectionsSelects : ["_record1id_value"],
            FormattedValues: false, // Why do we have to do this just to get ownerids?
            Filter: toIdFilter,
            Expand: [{
                Property: navProperty,
                //Select: options.entitySelects || []
                Select: options.entitySelects || undefined
            }]
        };
        if (options.connectionsFilter) qopts.Filter = qopts.Filter + " and " +
            options.connectionsFilter;
        return this.client.GetList("connections", qopts).
            then(r => {
                //console.log("Returned connections:", r)
                return r.List ? _extractIds(r.List) : []
            })
            .then(ids => {
                var entitiesP = ids.map(id => getEntityFromId(id))
                return Promise.all(entitiesP)
            })
    }

    /**
     * Access connections and return the "1" (left) object that is retrieved using a nav property.
     * This is a bit of a quick and dirty way to get the objects via the connections entityset.
     * However, you cannot get every attributes easily on the expanded nav property, so you may need 2-pull.
     */
    public getEntityFromNavUsingConnectionsTo = async (toId, entity,
        options: QueryOptions & {
            entitySelects?: Array<string>
            formattedValues?: Array<string>
            connectionsFilter?: Array<string>
            connectionsSelects?: Array<string>
        } = {
                FormattedValues: true
            }) => {
        const toIdFilter = `_record2id_value eq ${toId}`
        const navProperty = `record1id_${entity}`
        const qopts = {
            Select: options.connectionsSelects ? options.connectionsSelects : ["_record1id_value"],
            FormattedValues: options.FormattedValues || true, // Why do we have to do this just to get ownerids?
            Filter: toIdFilter,
            Expand: [{
                Property: navProperty,
                Select: options.entitySelects || undefined,
                //Select: options.entitySelects || [],
            }]
        }
        if (options.connectionsFilter) qopts.Filter = qopts.Filter + " and " + options.connectionsFilter
        return this.client.GetList("connections", qopts).
            then(r => {
                return r.List.map(obj => obj[navProperty]).filter(i => !!i) // || [];
            })
    }

    /**
     * Return entities from a navigation property for an entity.
     * Content is sorted by createdon date descending by default.
     *
     * @param nav Navigation property that leads to the entities.
     * @return {array} Entities obtained from navigation property.
     */
    public getEntitiesFromNav = async (entitySet, id, nav, options?: QueryOptions) => {
        options = {
            FormattedValues: true,
            OrderBy: ["createdon desc"],
            ...options
        }
        const qopts: QueryOptions = {
            ...options,
            Expand: [{ Property: nav }],
        }
        // if (DEBUG) console.log("DAO.getEntitiesFromNav", entitySet, id, qopts)
        return this.client.Get(entitySet, id, qopts).
            then(r => r[nav])
    }

    /**
     * Return Activities for Contact. Access using Contact_ActivityPointers
     * in the returned object.
     */
    public getActivitiesForContact = async (id: string, Filter: string) => {
        return (this.getEntitiesFromNav("contacts", id, "Contact_ActivityPointers", { Filter }))
    }

    /**
     * Return Activities for Account. Access using Account_ActivityPointers
     * in the returned object.
     */
    public getActivitiesForAccounts = async (id: string, Filter: string) => {
        return (this.getEntitiesFromNav("accounts", id, "Account_ActivityPointers", { Filter }))
    }

    /**
     * Return annotations for a given object id e.g. a contact id or an account id.
     */
    public getAnnotationsFor = async (id, options?: QueryOptions) => {
        const qopts: QueryOptions = {
            OrderBy: ["createdon desc"],
            FormattedValues: true,
            ...options,
            Filter: (options && options.Filter ? options.Filter + " and ": "") + `_objectid_value eq ${id}`,
        }
        return this.client.GetList("annotations", qopts).
            then(r => r.List)
    }

    /**
     * Get rollup entities for an entity specified by (entityId, entitySet). For example,
     * use "activitypointer" for entityName.
     * @param entityName the singlular name of the entity that is being rolled up (returned).
     * @param entityId Entity id e.g. a contact id.
     * @parm entiytSet The plural name that the entity with entityId id represents e.g. contacts
     * @param rollupType Value from RollupType.
     * @param selects Array of attributes to return. If nil, return all.
     *
     */
    public getRollupFor = async (entityId, entitySet, entityName, rollupType, selects) => {
        const target = {
            "@odata.id": `${entitySet}(${entityId})`,
        }
        const columns = selects ? { Columns: selects } : { AllColumns: "true" }
        const query = {
            "@odata.type": "Microsoft.Dynamics.CRM.QueryExpression",
            EntityName: entityName,
            ColumnSet: columns,
        }
        const parameters = {
            Target: new ToString(JSON.stringify(target)),
            RollupType: new ToString(rollupType),
            Query: new ToString(JSON.stringify(query)),
        }
        return this.client.ExecuteFunction("Rollup", parameters).
            then(r => r.value)
    }

    /**
     * Obtain activities via activityparties and by expanding a nav property.
     * You can obtain the activity pointers or a specific activity type by changing
     * the single-valued navigation property e.g. "activityid_appointment" vs
     * "activityid_activitypointer". Its possible that the actual party (id) is deleted
     * but this record persists. If dropIfPartyDeleted is true, then an empty
     * array is returned if ispartydeleted is true. Default is false.
     *
     * @param {string} id Entity id for allowed activity party entities (_partyid_value) e.g. the specific contact or account.
     * @param {array[int]} Array of participation type masks. See https://msdn.microsoft.com/en-us/library/mt607938.aspx.
     */
    public getActivityPartyActivitiesFor = (id: string,
        options: Props1 = {
            dropIfPartyDeleted: false,
            Select: ["ispartydeleted"],
            FormattedValues: true,
            navSelects: [],
            nav: "activityid_activitypointer",
        }) => {
        if (options.Select && Array.isArray(options.Select) &&
            !options.Select.includes("ispartydeleted"))
            options.Select = options.Select.concat(["ispartydeleted"])

        const expand = {
            Property: options.nav,
            ...(options.navSelects ? { Select: options.navSelects } : {}),
        }

        const qopts: QueryOptions = {
            FormattedValues: options.FormattedValues,
            Filter: `_partyid_value eq ${id}`,
            Expand: [expand],
            Select: options.Select,
        }
        if (options.Filter) qopts.Filter = `${qopts.Filter} and ${options.Filter}`
        if (options.OrderBy) qopts.OrderBy = options.OrderBy
        if (options.participationtypemask) {
            const pfilter = options.participationtypemask.map(p =>
                `participationtypemask eq ${p}`).join(" or ")
            qopts.Filter = `${qopts.Filter} and (${pfilter})`
        }
        return this.client.GetList("activityparties", qopts).
            then(r => {
                //if (r.ispartydeleted && options.dropIfPartyDeleted) return []
                return r.List ?
                    r.List.map((i: any) => {
                        if (i.ispartydeleted && i.ispartydeleted === true &&
                            options.dropIfPartyDeleted) return null
                        else return i[options.nav!]
                    }).filter(i => i !== null) :
                    []
            })
    }

    /** Return a Promise(activitypointer). Pulls everything unless selects are used. */
    public getActivityPointer = async (id: string, selects?: Array<string>) => {
        const qopts: QueryOptions = {
            FormattedValues: true,
        }
        if (selects && selects.length > 0) qopts.Select = selects
        return this.client.Get("activitypointers", id, qopts)
    }

    /** Obtain a single sub-activity with a specific activity id formatted values and maybe some selects. */
    public getOne = async <T>(entitySet: string, id: string, selects?: Array<string>) => {
        const qopts: QueryOptions = {
            FormattedValues: true,
            Filter: `activityid eq ${id}`,
        }
        if (selects && selects.length > 0) qopts.Select = selects
        return this.client.Get<T>(entitySet, id, qopts)
    }

    /**
     * Get activities inclusively between start and stop. Both should be javascript dates.
     * The scheduledstart date attribute must be defined, in the right range and
     * scheduleddurationinminutes must be a number ge 0.
     */
    public getActivitiesWithStart = async (start: Date, end: Date,
        options: {
            selects?: Array<string>,
            dateAttr?: string
        }) => {
        options.dateAttr = options.dateAttr || "scheduledstart"
        const qopts: QueryOptions = {
            FormattedValues: true,
            Filter: `(${options.dateAttr} ge ${start.toISOString()}) and (${options.dateAttr} le ${end.toISOString()}) and (scheduleddurationminutes ge 0)`,
        }
        if (options.selects && options.selects.length > 0) qopts.Select = options.selects
        return this.client.GetList("activitypointers", qopts).
            then(r => r.List)
    }

    /** Get a limited set of attributes on users. */
    public getAllUsers = async (selects = defaultUserAttributes) => {
        const qopts: QueryOptions = {
            FormattedValues: true,
        }
        if (selects && selects.length > 0) qopts.Select = selects
        return this.client.GetList("systemusers", qopts).
            then(r => r.List)
    }
}
