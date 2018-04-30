import * as React from "react"
import { compose, withState, withHandlers, ComponentEnhancer } from "recompose"
import { Omit } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/interfaces"
import { Id } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { EntityDefinition, Attribute, Metadata } from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"
import { Client, normalizeWith } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { pathOr } from "ramda"

/** What the output of [addEditorState] will receive as input. */
export interface EditorProps {
    /** The editor is dirty. */
    isDirty: boolean
    /** 
     * The editor is editing. This could mean something specific to each editor, 
     * not just real-time editing status.
     */
    isEditing: boolean
    setDirty: (v: boolean) => void
    setEditing: (v: boolean) => void
    resetDirty: () => void
    resetEditing: () => void
}

/**
 * HOC to add isDirty and isEditing state management plus a few functions.
 * Input component goes from from `P extends EditorProps` =>  `P omit EditorProps`.
 */
export function addEditorState<P extends EditorProps>(component: React.ComponentType<P>) {
    return compose<P, Omit<P, EditorProps>>(
        withState("isEditing", "setEditing", false),
        withState("isDirty", "setDirty", false),
        withHandlers({
            resetDirty: ({ setDirty }) => () => setDirty(false),
            resetEditing: ({ setEditing }) => () => setEditing(false)
        })
    )(component)
}

/** 
 * Data controller for an editor. Methods should reflect both data integrity
 * as well as security concerns as much as possible. The controller may hold
 * state if "edit"ing is allowed as changed to values are stored in the controller.
 * Attribute level changes are accumulated in the controller until they are "save"d
 * or reset. This allows us to pull "state" management out of the UI components and put it
 * directly into the "data" part of the editor.
 *
 * @template T Type of entity record.
 */
export interface DataController<T> {
    /** 
     * Allow a delete or not. May be called a few times (not several) for the same 
     * item so be efficient. If a string is returned, you cannot delete and the 
     * string is the message, otherwise, you can delete. If not present, but
     * `delete`, then all addresses can be deleted. If you override this, call
     * and process the `defaultCanDelete` as well.
     *
     * The idea is that this is called separately from delete to help improve UI
     * effectiveness.
     */
    canDelete?: (a: T) => Promise<string|void>

    /** Can we deactivate an entity (soft delete)? */
    canDeactivate?: (a: T) => Promise<boolean>

    /** Deactivate an entity, if canDeactive was true. */
    deactivate?: (id: Id) => Promise<string | void>

    /** Delete an entity if canDelete was true. */
    delete?: (a: T) => Promise<string | void>

    /** 
     * Create a new T with some initial values. May require asynchronous processing.
     */
    create?: (context: Record<string, any>) => Promise<T>

    /** Whether *anything* can be edited for a given entity. */
    isEditable: (id?: Id) => Promise<boolean>

    /** Whether a specific attribute can be edited. */
    canEdit: (attributeId: string, id?: Id) => boolean

    /** 
     * Save indicated changes.
     */
    save: (a: T, changed: Array<string>) => Promise<string | void>
}

/**
 * Entity metadata of the entity being edited.
 *
 * We need variance attributes on attributesByid and attributesByName.
 */
export interface EditorEntityMetadata {
    /** core entity definition */
    entity: EntityDefinition
    /** all attributes */
    attributes: Array<Attribute>
    /** 
     * by metadata id, guaranteed unique in
     * case editing more than one entity with same attribute name. Individual attributes may have been
     * expanded e.g. Attribute => PickListAttributeMetadata with OptionSet expanded.
     */
    attributesById: Record<string, Attribute>
    /** By logical name. For a single entity, should be unique. */
    attributesByName: Record<string, Attribute>
}

/**
 * Create a EditorEntityMetadata needed to drive an editor centered on a single entity.
 * If your metadata has special fetch needs, such as expanding specific attributes so that their
 * full metadata is retrieved, e.g. PickListAttributeMetadata expanding OptionSet and GlobalOptionSet,
 * you should do that here.
 * @param entityName 
 * @param metadata 
 */
export async function makeEntityMetadata(entityName: string, metadata: Metadata): Promise<EditorEntityMetadata> {
    return metadata.getMetadata(entityName)
        .then(ed => {
            return metadata.getAttributes(entityName)
                .then(attrs => ({
                    entity: ed!,
                    attributes: attrs,
                    attributesById: normalizeWith("MetadataId", attrs),
                    attributesByName: normalizeWith("LogicalName", attrs),
                }))
        })
}

/**
 * Create a value mapper from an entity with two attributes. Use this only on small lookup domains.
 * @param entitySetName Entity set name to form the lookup.
 * @param lookup Attribute lookup logical name. This is the "fk" typically found in the entity record.
 * @param result Attribute result logical name. This is the resulting value to display in the UI.
 */
export async function makeValueMapper(client: Client, entitySetName: string, 
    lookup: string, result: string): Promise<(value: string) => string> {
    const qopts = {
            Select: [lookup, result]
        }
    return client.GetList<any>(entitySetName, qopts)
    .then(r => {
        const mapped =  normalizeWith(lookup, r.List)
        return (value: string) => pathOr(value, [value, result], mapped)    
    })
}

export interface AttributeSpecification {
    /** logical name on entity */
    name: string
    /** order, temporary until we get some more layout control */
    position: number

    // rendered control type information to override defaults?
    // ...
}

/**
 * Top down data to display on a form, including layout information. 
 * Ok, no layout information yet...can we translate that found in a dynmics form?
 */
export interface EditorSpecification {
    /** Attributes to show in the form. */
    attributes: Array<AttributeSpecification>
    /** Metadata about the entity and attributes being edited. */
    metadata: EditorEntityMetadata
    /** 
     * A function that initiates a UI specific search if its not 
     * built into the UI control itself. Errors should be propagated 
     * downstream for end-of-world handling.
     */
    performSearch: (entities: Array<string>, allowMultiple?: boolean) => PerformSearchResult
}

/** Empty array => no selection, otherwise new selection. */
export type PerformSearchResult = PromiseLike<Array<Xrm.LookupValue>>
