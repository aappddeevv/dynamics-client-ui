import * as React from "react"
import { compose, withState, withHandlers, ComponentEnhancer } from "recompose"
import { Omit } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/interfaces"
import { Id } from "@aappddeevv/dynamics-client-ui/lib/Data"
import { EntityDefinition, Attribute } from "@aappddeevv/dynamics-client-ui/lib/Data/Metadata"

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
export interface EditorController<T> {
    /** 
     * Allow a delete or not. May be called a few times (not several) for the same 
     * item so be efficient.
     */
    canDelete?: (a: T) => Promise<boolean>

    /** Can we deactivate an entity (soft delete)? */
    canDeactivate?: (a: T) => Promise<boolean>

    /** Deactivate an entity, if canDeactive was true. */
    deactivate?: (id: Id) => Promise<string | void>

    /** Delete an entity if canDelete was true. */
    delete?: (a: T) => Promise<string | void>

    /** Create a new T with some initial values. May require asynchronous processing. */
    create?: (context: Record<string, any>) => Promise<T>

    /** Whether *anything* can be edited for a given entity. */
    isEditable: (id?: Id) => Promise<boolean>

    /** Whether a specific attribute can be edited. */
    canEdit: (attributeId: string, id?: Id) => boolean

    /** 
     * Save accumulated changes. Resets change state, if any. Returns true even if
     * there were no changes to save.
     */
    save: (id?: Id) => Promise<string | void>

    /** 
     * Record a changed value for an entity+attribute. Return user friendly message if change 
     * is *not* allowed.
     */
    onChange: (id: Id, attributeId: string, newValue: any) => Promise<string | void>

    /** Whether onChange has been called. */
    hasChanges: (id?: Id) => boolean

    /** Reset any changes. */
    resetChanges: (id?: Id) => void
}

/**
 * Entity metadata of the entity being edited.
 */
export interface EditorEntityMetadata {
    /** core entity definition */
    entity: EntityDefinition
    /** all attributes */
    attributes: Array<Attribute>
    /** 
     * by metadata id, guaranteed unique in
     * case editing more than one entity with same attribute name.
     */
    attributesById: Record<string, Attribute>
    /** By logical name. For a single entity, should be unique. */
    attributesByName: Record<string, Attribute>
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
     * built into the UI control itself.
     */
    performSearch: (entities: Array<string>, allowMultiple?: boolean) => PerformSearchResult
}

export type PerformSearchResult = PromiseLike<Xrm.LookupValue | void>
