/**
 * Metadata access with cacheing so its not too slow. Cache
 * is shared across all Metadata instances.
 */

import { DEBUG, FALLBACK_LCID } from "BuildSettings"
import { Id, QueryOptions, Option as ApiOption } from "./CRMWebAPI"
import { Client } from "./client"
import values from "ramda/es/values"
import mergeDeepRight from "ramda/es/mergeDeepRight"
import { IResult, Ok, Err } from "../Dynamics/Result"

export interface LabelValue {
    Label: string
    Value: number
}

/** From OptionSet. */
export interface Option extends LabelValue {
    Description?: string
}

export interface MetadataBase {
    MetadataId: string
}

export interface EntityDefinition extends MetadataBase {
    SchemaName: string
    LogicalName: string
    PrimaryIdAttribute: string
    PrimaryNameAttribute: string
    LogicalCollectionName: string
    IconSmallName: string | null

    Description?: string
    DisplayName?: string

    Attributes?: Array<Attribute>
}

export interface Relationship extends MetadataBase {
    ReferencedAttribute: string
    ReferencedEntity: string,
    ReferencedEntityNavigationPropertyName: string

    ReferencingAttribute: string
    ReferencingEntity: string
    ReferencingEntityNavigationPropertyName: string

    RelationshipType: string // always OneToManyRelationship

    SchemaName: string
    IsManaged: boolean
    IsHierarchical: boolean
    PrimaryNameAttribute: string
    /** OOTB or created through customization. */
    IsCustomRelationship: boolean
}

/**
 * 1:N => Referenced is the 1 side. For example, for all contact.OneToManyRelationships,
 * the ReferenceEntity is always "contact".
 */
export interface OneToManyRelationship extends Relationship { }

/**
 * N:1 => Referenced is the N side. For example, for all contact.ManyToOneRelationships,
 * the ReferencingEntity is always "contact".
 */
export interface ManyToOneRelationship extends OneToManyRelationship { }

export interface BooleanManagedProperty {
    Value: boolean
    CanBeChanged: boolean
    ManagedPropertyLogicalName: string
}

export enum AttributeRequiredLevel {
    None = 0,
    SystemRequired = 1,
    ApplicationRequired = 2,
    Recommended = 3,
}

export interface AttributeRequiredLevelManagedProperty {
    Value: AttributeRequiredLevel
    CanBeCahnged: boolean
    ManagedPropertyLogicalName: string
}

/** This should be renamed LocalizedLabel. */
export interface Localized {
    HasChanged: boolean | null
    IsManaged: boolean
    Label: string | null
    LanguageCode: number
    MetadataId: string
}

/** The type of descrciptions, labels and names. This shouldd be name Label. */
export interface LocalizedLabels {
    UserLocalizedLabel: Localized
    LocalizedLabels: Array<Localized>
}

/**
 * Return the user localized label using lcid if its provided and found.
 */
export function getLabel(labels: LocalizedLabels, lcid: number = FALLBACK_LCID): Localized | null {
    if (lcid === 0 && labels.UserLocalizedLabel) {
        // if no lcid, return the default if it exists
        return labels.UserLocalizedLabel
    }
    const x = labels.LocalizedLabels.filter(l => l.LanguageCode === lcid)
    if (x.length > 0) return x[0]
    return null
}

/** Simple attribute. */
export interface Attribute extends MetadataBase {
    LogicalName: string
    AttributeOf: string | null
    /** A string like Decimal or Picklist or Lookup. */
    AttributeType: string
    /** Typicalyl appends the suffix "Type" to AttributeType. */
    AttributeTypeName: { Value: string }
    ColumnNumber: number
    DatabaseLength: number | null
    Description: LocalizedLabels
    DisplayName: LocalizedLabels
    /** Entity this attribute belongs. */
    EntityLogicalName: string
    /** Undocumented. */
    ExternalName: string | null
    FormulaDefinition: string | null
    HasChanged: boolean | null
    RequiredLevel: AttributeRequiredLevelManagedProperty
    IsAuditEnabled: BooleanManagedProperty
    IsCustomAttribute: boolean
    IsCustomizable: BooleanManagedProperty
    IsDataSourceSecret: boolean
    IsFilterable: boolean
    IsGlobalFilterEnabled: BooleanManagedProperty
    IsLocalizable: boolean
    IsLogical: boolean
    IsManaged: boolean
    IsPrimaryId: boolean
    IsPrimaryName: boolean
    IsRenameable: boolean
    /** Undocumented. */
    IsRequiredForForm: boolean
    /** Use this to find retrievable attributes. */
    IsRetrievable: boolean
    IsSearchable: boolean
    IsSecured: boolean
    IsSortableEnabled: BooleanManagedProperty
    IsValidForAdvancedFind: BooleanManagedProperty
    /** True, can include in a create request. */
    IsValidForCreate: boolean
    IsValidForForm: boolean
    IsValidForGrid: boolean
    IsValidForRead: boolean
    IsValidForUpdate: boolean
    LinkedAttributeId: string | null
    MaxLength: number
    /** Often, but not always, a semi-capitalized version of logical name. */
    SchemaName: string
    /** For rollup/calculated attributes only. */
    SourceType: number
    SourceTypeMask: number
}

export interface StringAttribute extends Attribute {
    MaxLength: number
}

export interface LookupAttribute extends Attribute {
    /** Array of logical entity names that can be looked up. */
    Targets: Array<string>
}

export interface OptionMetadata extends MetadataBase {
    /** Int */
    Value: number
    Label: Localized
    Description: Localized
    Color: string
    IsManaged: boolean
    HasChanged: boolean
}

export interface OptionSetMetadata {
    Description: Localized
    DisplayName: Localized
    IsGlobal: boolean
    IsMangaed: boolean
    Name: string
    Options: OptionMetadata
}

export interface EnumAttributeMetadata extends Attribute {
}

/** For use in `lookupEnumAttribute` */
export enum EnumAttributeTypes {
    MultiSelectPickList = "Microsoft.Dynamics.CRM.MultiSelectPickListAttributeMetadata",
    PickList = "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    Status = "Microsoft.Dynamics.CRM.StatusAttributeMetadata",
    State = "Microsoft.Dynamics.CRM.StateAttributeMetadata",
    EntityName = "Microsoft.Dynamics.CRM.EntityNameAttributeMetadata",
}

/**
 * You get these fields if you "$expand" on each and "$select=Options"
 */
export interface PickListAttributeMetadata extends EnumAttributeMetadata {
    OptionSet: OptionSetMetadata
    GlobalOptionSet: OptionSetMetadata
}

/** [entity name] => {[attribute name]: Attribute} */
let entityToAttribute = {}

/** singular entity name to entity object */
const entityNameToDefinition: Map<string, EntityDefinition> = new Map()
const entityDefinitions: Array<EntityDefinition> = []

/** entity logical name to array of relationships */
const entityNameToOneToMany: Map<string, Array<OneToManyRelationship>> = new Map()
const entityNameToManyToOne: Map<string, Array<ManyToOneRelationship>> = new Map()

export interface ObjectTypeCodePair {
    LogicalName: string
    ObjectTypeCode: number
}

let objectTypeCodes: Array<ObjectTypeCodePair> = []
const objectTypeCodesByCode: Map<number, ObjectTypeCodePair> = new Map()
const objectTypeCodesByName: Map<string, ObjectTypeCodePair> = new Map()

/** Connection role categories. Classifies a ConnectionRole. Value is the fk. */
export interface ConnectionRoleCategory {
    Label: string
    Value: number
}

let connectionRoleCategories: Array<ConnectionRoleCategory> = []
const connectionRoleCategoriesByName: Map<string, ConnectionRoleCategory> = new Map()
const connectionRoleCategoriesByValue: Map<number, ConnectionRoleCategory> = new Map()

/** Set of all connection roles. */
export interface ConnectionRole {
    connectionroleid: string
    name: string
    /** FK to ConnectionRoleCategory */
    category: number
    /** Name of ConnectionRoleCategory */
    ["category@OData.Community.Display.V1.FormattedValue"]: string
    description: string
    statecode: number
    statuscode: number
    /** http link to reciprocals. */
    ["connectionroleassociation_association@odata.nextLink"]: string
}

let connectionRoles: Array<ConnectionRole> = []
const connectionRolesById: Map<Id, ConnectionRole> = new Map()
const connectionRolesByName: Map<string, ConnectionRole> = new Map()
/** Reciprocal connection roles. Most just have 1 but you can have many. */
const connectionRoleAssociatedRoles: Map<Id, Array<Id>> = new Map()

/**
 * An entry describing the type of object a connection role can connect to.
 */
export interface ConnectionRoleObjectTypeCode {
    /** Same as associatedobjecttypecode. */
    entityName: string

    /** Same as _connectionroleid_value_formatted. */
    roleName: string

    connectionroleobjecttypecodeid: Id

    /** Logical name of allowed entity e.g. contact or systemuser. */
    associatedobjecttypecode: string

    /** Display name of allowed entity e.g systemuser => User. */
    "associatedobjecttypecode@OData.Community.Display.V1.FormattedValue": string

    /** Display name of allowed entity. */
    associatedobjecttypecode_formatted: string

    organizationid: Id

    /** Connection role's id's */
    _connectionroleid_value: Id

    /** The connection role's display name .*/
    "_connectionroleid_value@OData.Community.Display.V1.FormattedValue": string

    /** The connection role's display name. */
    _connectionroleid_value_formatted: string
}

let connectionRoleObjectTypeCodes: Array<ConnectionRoleObjectTypeCode> = []
/** Cache that indexes by a connection role's id. */
const connectionRoleObjectTypeCodesByRoleId: Map<Id, Array<ConnectionRoleObjectTypeCode>> = new Map()

/**
 * Metadata API. Fetched metadata is shared among all instances of this class at the moment.
 */
export class Metadata {
    constructor(client: Client, lcid: number = FALLBACK_LCID) {
        this.client = client
        this.lcid = lcid
    }

    private lcid: number
    private client: Client

    public getLabel(labels: LocalizedLabels): Localized | null {
        return getLabel(labels, this.lcid)
    }

    /**
     * Get all attributes for a logical entity name or return []
     * This does not get the attribute as a specific type hence
     * it does not know about or expand interesting attributes e.g.
     * GlobalOptionSet in PickListAttributeMetadata.
     */
    public getAttributes = async (entityName: string): Promise<Array<Attribute>> => {
        // quick wins and cache check
        if (!entityName) {
            if (DEBUG) console.log("Metadata.getAttributes: called with nil entityName")
            return []
        }
        else if (entityName in entityToAttribute) {
            const entry = entityToAttribute[entityName]
            return values(entry)
        }
        try {
            const m = await this.getMetadata(entityName)
            // Navigate to attributes by pulling an EntityDefinition with the Attributes.
            const attrs = await this.client.Get<EntityDefinition>("EntityDefinitions", m!.MetadataId, {
                Select: ["LogicalName"],
                Expand: [{ Property: "Attributes" }]
            }).
                then(m => m.Attributes)
            if (attrs && attrs.length > 0) {
                // place in cache, by logical name!
                const mergeMe = attrs.reduce((accum, a) => {
                    accum[a.LogicalName] = a
                    return accum
                }, {})
                entityToAttribute = mergeDeepRight(entityToAttribute, {
                    [entityName]: mergeMe
                })
                return attrs
            }
        } catch (e) {
            console.log(`Error obtaining entity attributes for entity name '${entityName}'`, e)
        }
        // no attributes returned? probably a bad entity name?? should we error?
        return []
    }

    /** Find a specific entity-attribute metadata. Return null if not found. */
    public lookupAttribute = async <T=Attribute>(entityName: string, attributeName: string): Promise<T | null> => {
        if (DEBUG) {
            console.log(`Metadata.lookupAttribute: looking up '${entityName}.${attributeName}'`)
        }
        if (!entityName || !attributeName) return null
        await this.getAttributes(entityName)
        // attributes for entityName should be in "cache"
        const entityAttributes = entityToAttribute[entityName]
        if (entityAttributes) {
            const attribute = entityAttributes[attributeName]
            if (attribute) return attribute
        }
        return null
    }

    /**
     * Lookup an attribute as a specific type and return all type specific fields for that attribute.
     * Result is not cached! You must provide the specific type.
     */
    public lookupEnumAttribute = async <T=Attribute>(entityName: string, attributeName: string,
        castTo: EnumAttributeTypes): Promise<EnumAttributeMetadata | null> => {
        const emeta = await this.getMetadata(entityName)
        if (!emeta) return null
        const ameta = await this.lookupAttribute(entityName, attributeName)
        if (!ameta) return null
        const qopts: QueryOptions = {
            // no Select, get all attributes again
            Path: [
                {
                    Property: `Attributes(${ameta.MetadataId!})`,
                    Type: castTo,
                },
            ],
            Expand: [{
                Property: "OptionSet",
                Select: ["Options"],
            }, {
                Property: "GlobalOptionSet",
                Select: ["Options"],
            }]
        }
        return this.client.Get<PickListAttributeMetadata>("EntityDefinitions", emeta.MetadataId, qopts)
    }

    /** Returns all entity {LogicalName, ObjectTypeCode} pairs. */
    public getObjectTypeCodes = async () => {
        if (objectTypeCodes.length > 0) return objectTypeCodes
        const qopts = {
            Select: ["LogicalName", "ObjectTypeCode"]
        }
        const r = await this.client.GetList<ObjectTypeCodePair>("EntityDefinitions", qopts)
        objectTypeCodes = r.List
        objectTypeCodes.forEach(c => objectTypeCodesByCode.set(c.ObjectTypeCode, c))
        objectTypeCodes.forEach(c => objectTypeCodesByName.set(c.LogicalName, c))
        return objectTypeCodes
    }

    /** Given a numerical code, return the (LogicalName, ObjectTypeCode) pair. */
    public async lookupObjectTypeCodeByCode(code: number) {
        await this.getObjectTypeCodes()
        return objectTypeCodesByCode.get(code)
    }

    /** Given a name, return the (LogicalName, ObjectTypeCode) pair. */
    public lookupObjectTypeCodeByName = async (name: string) => {
        await this.getObjectTypeCodes()
        return objectTypeCodesByName.get(name)
    }

    /** Pass in the entity singular logical name. Returns null if not found. Pulls all attributes but no navs. */
    public getMetadata = async (entityName: string): Promise<EntityDefinition | null> => {
        const cacheCheck = entityNameToDefinition.get(entityName)
        if (DEBUG) console.log(`Metadata.getMetadata: entity name ${entityName}, cache check:`, cacheCheck, entityNameToDefinition.size)
        if (cacheCheck) return cacheCheck

        const qopts = {
            Filter: `LogicalName eq '${entityName}'`
        }

        // We can do this with a EntityDefinitions(LogicalName='..name...') but CRMWebAPI
        // does not have that.
        return this.client.GetList<EntityDefinition>("EntityDefinitions", qopts).
            then(r => {
                if (!r.List) return null
                // add to cache
                const edef: EntityDefinition = r.List[0]
                entityDefinitions.push(edef)
                if (!entityNameToDefinition.has(entityName)) {
                    entityNameToDefinition.set(entityName, edef)
                    //console.log("Metadata.getMetadata: added entity ", entityName, edef)
                }
                return edef
            })
    }

    /** Get the entity set name given the entity logical name e.g. contact => contacts. */
    public getEntitySetName = async (logicalName: string) => {
        const md = await this.getMetadata(logicalName)
        if (md) return md.LogicalCollectionName
        return null
    }

    /** Get the schema name given the entity logical name. */
    public getSchemaName = async (logicalName: string) => {
        const md = await this.getMetadata(logicalName)
        if (md) return md.SchemaName
        return null
    }

    /** Return all connection roles. */
    public getConnectionRoles = async () => {
        if (connectionRoles.length > 0) return connectionRoles
        const qopts = {
            FormattedValues: true,
            Filter: "statecode eq 0",
            Expand: [
                { Property: "connectionroleassociation_association" },
                //{Property: "connectionroleassociation_association_referenced"},
            ],
        }
        const r = await this.client.GetList<ConnectionRole>("connectionroles", qopts).then(r => r.List)
        //console.log("connectionroles", r)
        connectionRoles = r
        connectionRoles.forEach(cr => connectionRolesById.set(cr.connectionroleid, cr))
        connectionRoles.forEach(cr => connectionRolesByName.set(cr.name, cr))
        return r
    }

    /** Get "reciprocal" ConnectionRoles. You'll need to lookup the id using `getConnectionRoleById`. */
    public getConnectionRoleAssociatedConnectionRoles = async (connectionRoleId: Id): Promise<Array<Id>> => {
        if (connectionRoleAssociatedRoles.has(connectionRoleId))
            return connectionRoleAssociatedRoles.get(connectionRoleId)!
        const cr = await this.getConnectionRoleById(connectionRoleId)
        if (!cr) return []
        const qopts = {
            Select: ["connectionroledid"],
        }
        const associated = await
            this.client.Fetch(cr["connectionroleassociation_association@odata.nextLink"], qopts)
                .then(r => r.value)
        const associatedIds = associated.map(cr => cr.connectionroleid)
        connectionRoleAssociatedRoles.set(connectionRoleId, associatedIds)
        return associatedIds
    }

    /**
     * Return an array of connection roles for a given connection category name.
     *
     * TODO: Rewrite this so it does not need a filter, just use the id lookup cache.
     */
    public getConnectionRolesForCategoryNamed = async (categoryName: string): Promise<Array<ConnectionRole>> => {
        const roles = await this.getConnectionRoles()
        const cat = await this.getConnectionRoleCategoryByName(categoryName)
        return roles.filter(cr => cr!.category === cat!.Value)
    }

    public getConnectionRoleByCategoryAndName = async (categoryName: string, roleName: string):
        Promise<ConnectionRole | null> => {
        await this.getConnectionRoles()
        const x = connectionRoles.filter(cr => cr.name === roleName &&
            cr["category@OData.Community.Display.V1.FormattedValue"] === categoryName)
        if (x.length === 1) return x[0]
        return null
    }

    /** Return a connection role by its id. */
    public getConnectionRoleById = async (id: string): Promise<ConnectionRole | null> => {
        await this.getConnectionRoles()
        const r = connectionRolesById.get(id)
        return r ? r : null
    }

    /** Return a connection role by its name. */
    public getConnectionRoleByName = async (name: string): Promise<ConnectionRole | null> => {
        await this.getConnectionRoles()
        const r = connectionRolesByName.get(name)
        return r ? r : null
    }

    /** Return an array of connection role categories. */
    public getConnectionRoleCategories = async () => {
        if (connectionRoleCategories.length > 0)
            return connectionRoleCategories

        const r = await this.client.GetOptionSetUserLabels("connectionrole_category")
        connectionRoleCategories = connectionRoleCategories.concat(r)
        connectionRoleCategories.forEach(crc => connectionRoleCategoriesByName.set(crc.Label, crc))
        connectionRoleCategories.forEach(crc => connectionRoleCategoriesByValue.set(crc.Value, crc))
        return connectionRoleCategories
    }

    /** Return a connecton role category by value (Category = OptionSet). */
    public getConnectionRoleCategoryByValue = async (value: number) => {
        await this.getConnectionRoleCategories()
        return connectionRoleCategoriesByValue.get(value)
    }

    /** Return a connection role category its name. */
    public getConnectionRoleCategoryByName = async (name: string) => {
        await this.getConnectionRoleCategories()
        return connectionRoleCategoriesByName.get(name)
    }

    /**
     * Obtain the list of allowed object type. Empty means any entity type is allowed.
     */
    public getAllowedTypeCodesForConnectionRoleId = async (roleId: Id):
        Promise<Array<ConnectionRoleObjectTypeCode>> => {
        const cacheItem = connectionRoleObjectTypeCodesByRoleId.get(roleId)
        if (cacheItem !== undefined) return cacheItem

        const qopts = {
            FormattedValues: true,
            Filter: `_connectionroleid_value eq ${roleId}`
        }
        return this.client.GetList<ConnectionRoleObjectTypeCode>("connectionroleobjecttypecodes", qopts).
            then(r => {
                const list = r.List.map(i => ({
                    ...i,
                    entityName: i.associatedobjecttypecode,
                    associatedobjecttypecode_formatted: i["associatedobjecttypecode@OData.Community.Display.V1.FormattedValue"],
                    _connectionroleid_value_formatted: i["_connectionroleid_value@OData.Community.Display.V1.FormattedValue"],
                    roleName: i["_connectionroleid_value@OData.Community.Display.V1.FormattedValue"],
                }))
                if (list.length > 0) {
                    connectionRoleObjectTypeCodes = connectionRoleObjectTypeCodes.concat(list)
                }
                connectionRoleObjectTypeCodesByRoleId.set(roleId, list)
                return list
            })
    }

    /**
     * Get Option pairs back, Label and Value or an empty list..
     * Hackey implementation. Only looks at Attribute.OptionSet not Attribute.GlobalOptionSet.
     * Not cached yet!!! We should look at both OptionSet's and choose one that is available.
     */
    public getOptionSet = async (entityLogicalName: string,
        attributeLogicalName: string): Promise<Array<Option>> => {
        const emeta = await this.getMetadata(entityLogicalName)
        const ameta = await this.lookupAttribute(entityLogicalName, attributeLogicalName)
        if (!emeta || !ameta) return []
        const qopts: QueryOptions = {
            Select: ["Options"],
            Path: [
                {
                    Property: `Attributes(${ameta.MetadataId!})`,
                    Type: "Microsoft.Dynamics.CRM.PicklistAttributeMetadata"
                },
                {
                    Property: "OptionSet",
                }]
        }
        const attr: any = await this.client.Get("EntityDefinitions", emeta.MetadataId, qopts)
        const pairs = attr.Options.map(opt => ({
            Label: opt.Label.LocalizedLabels[0].Label,
            Value: opt.Value
        }))
        //console.log("attr", attr, pairs)
        return pairs
    }

    /**
     * Return all activity types. How do we filter on non-published kinds?
     * This may return a surprising number of activities that are used only
     * in a specialized context so you absolutely will need to filter this list
     * down for use in your application.
     */
    public getAllActivityTypes = async (): Promise<Array<EntityDefinition>> => {
        const qopts: QueryOptions = {
            Select: ["LogicalName", "ObjectTypeCode", "Description", "DisplayName",
                "IconSmallName", "IconLargeName", "IconMediumName"],
            Filter: "IsActivity eq true",
        }
        const l = await this.client.GetList("EntityDefinitions", qopts).then(r => {

            return r.List.map((entry: EntityDefinition) => ({
                ...entry,
                // @ts-ignore
                Description: entry.Description.LocalizedLabels[0].Label,
                // @ts-ignore
                DisplayName: entry.DisplayName.LocalizedLabels[0].Label,
            }))
        })
        return l
    }

    /** Retur the primary PK logical attribute name for a given entity. */
    public getPk = async (entityLogicalName: string): Promise<string | null> => {
        return this.getMetadata(entityLogicalName).
            then(md => {
                if (md) return md.PrimaryIdAttribute
                return null
            })
    }

    /** Relationships. Returns empty array if not found. */
    public getOneToManyRelationships = async (entityLogicalName: string): Promise<Array<OneToManyRelationship>> => {
        const rels = entityNameToOneToMany.get(entityLogicalName)
        if (rels) return rels

        const m = await this.getMetadata(entityLogicalName)
        if (!m) return []
        return this.client.Get<any>(
            "EntityDefinitions", m!.MetadataId,
            {
                Select: ["LogicalName"],
                Expand: [{ Property: "OneToManyRelationships" }]
            }).
            then((r: any) => {
                entityNameToOneToMany.set(entityLogicalName, r.OneToManyRelationships)
                return r.OneToManyRelationships
            })
    }

    /** Get a 1:M relationship to a specific name. Could be multiple, so choose wisely. */
    public getOneToManyRelationshipsTo = async (entityLogicalName: string, toEntityLogicalName: string) => {
        const rels = await this.getOneToManyRelationships(entityLogicalName)
        return rels.filter(r => r.ReferencingEntityNavigationPropertyName === toEntityLogicalName)
    }

    /** Should be only one. null if not found. */
    public getOneToManyRelationshipBySchemaName = async (entityLogicalName: string, schemaName: string) => {
        const rels = await this.getOneToManyRelationships(entityLogicalName)
        const x = rels.filter(r => r.SchemaName === schemaName)
        if (x.length === 1) return x[0]
        return null
    }

    public getManyToOneRelationships = async (entityLogicalName: string):
        Promise<Array<ManyToOneRelationship>> => {
        const rels = entityNameToManyToOne.get(entityLogicalName)
        if (rels) return rels

        const m = await this.getMetadata(entityLogicalName)
        if (!m) return []
        return this.client.Get<any>(
            "EntityDefinitions", m!.MetadataId,
            {
                Select: ["LogicalName"],
                Expand: [{ Property: "ManyToOneRelationships" }]
            }).
            then((r: any) => {
                entityNameToManyToOne.set(entityLogicalName, r.ManyToOneRelationships)
                return r.ManyToOneRelationships
            })
    }

    public getManyToOneRelationshipsFrom = async (entityLogicalName: string,
        fromEntityLogicalName: string) => {
        const rels = await this.getManyToOneRelationships(entityLogicalName)
        return rels.filter(r => r.ReferencedEntityNavigationPropertyName === fromEntityLogicalName)
    }

    public getManyToOneRelationshipBySchemaName = async (entityLogicalName: string,
        schemaName: string) => {
        const rels = await this.getManyToOneRelationships(entityLogicalName)
        const x = rels.filter(r => r.SchemaName === schemaName)
        if (x.length === 1) return x[0]
        return null
    }
}

export default Metadata

/** Something that can provide a metadata object. */
export interface MetadataProvider {
    metadata: Metadata
}
