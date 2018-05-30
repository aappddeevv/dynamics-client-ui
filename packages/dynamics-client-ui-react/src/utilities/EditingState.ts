import * as React from "react"
import { compose, ComponentEnhancer, withStateHandlers } from "recompose"
import { Omit } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/interfaces"

/** What the output of [addEditorState] will receive as input. */
export interface EditorProps {
    /** The editor is dirty. */
    isDirty: boolean
    /** 
     * The editor is editing. This could mean something specific to each editor, 
     * not just real-time editing status. By default, think of this is a whether
     * the component is real-time editing an attribute.
     */
    isEditing: boolean
    setDirty: (v: boolean) => void
    setEditing: (v: boolean) => void
    resetDirty: () => void
    resetEditing: () => void
    resetEditingState: () => void
}

/**
 * HOC to add isDirty and isEditing state management plus a few functions.
 * Input component goes from from `P extends EditorProps` =>  `P omit EditorProps`.
 */
export function addEditorState<P extends EditorProps>(component: React.ComponentType<P>) {
    return compose<P, Omit<P, EditorProps>>(
        withStateHandlers(() => ({
            isEditing: false,
            isDirty: false
        }),
            {
                setDirty: ({ isDirty }) => (value) => ({
                    isDirty: value
                }),
                setEditing: ({ isEditing }) => (value) => ({
                    isEditing: value
                }),
                resetDirty: () => () => ({ isDirty: false }),
                resetEditing: () => () => ({ isEditing: false }),
                resetEditingState: () => () => ({
                    isEditing: false,
                    isDirty: false,
                })
            })
    )(component)
}
