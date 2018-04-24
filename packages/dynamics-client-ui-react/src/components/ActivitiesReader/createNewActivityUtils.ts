/**
 * Creating a new activity in Dynamics is fraught with peril
 *  if you want to use "create" forms.
 */
import { isUci } from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import { XRM } from "@aappddeevv/dynamics-client-ui"


/** Args for either openEntityForm or openForm. */
export interface OpenFormAPIArgs {
    /** Entity to open the form on. */
    entityName: string
    
    /** If its for an existing entity. Should be an id for the entityName entity type. */
    entityId?: string
    
    /** Window options */
    windowOptions?: { [propName: string]: any }
    
    /** Parameters, these are separate even in the openForm API. */
    parameters: {[propName: string]: any}

    // rest
    [propName: string]: any
}

/** General Xrm args for openForm and some for openEntityForm. */
export interface OpenFormArgs {
    /** Entity logical name to create or open the form on. */
    entityName: string
    entityId?: string
    
    /** Open in a new window, if possible on the device. */
    openInNewWindow?: boolean
    width?: number
    height?: number
    
    /** Mutually exclusive with openInNewWindow */
    useQuickCreateForm?: boolean

    /** More props. Pass through args. */
    parameters?: {[propName: string]: any}

    // misc allowed parameters
    processId?: string
    processInstanceId?: string
    createFromEntity?: Xrm.LookupValue
    relationship?: {name: string, relationshipType: number, roleType: number}
    
    // rest
    [propName: string]: any
}

/** 
 * A combination of parameters.
 */
export interface CreateActivityOpenFormArgs extends OpenFormArgs {
    /** 
     * A regarding object. Handled special since its assembly
     * depends on the API version. The parameters built from regarding
     * will override any in OpenFormArgs.parameters.
     */
    regardingEntity?: {
        id: string
        entityName: string
        name?: string
    }
}

/**
 * Given some data, create arguments that can be used in either
 * the unified interfaec or the standard web ui, the function args
 * requirements are different.
 */
export interface CreateActivityArgsBuilder {
    (inputs: CreateActivityOpenFormArgs): OpenFormAPIArgs
}

/** Default version. Adheres to non-UCI version of args. */
export const createActivityArgsBuilder = (args: CreateActivityOpenFormArgs): OpenFormAPIArgs => {
    const { openInNewWindow, width, height, entityName, entityId, useQuickCreateForm,
            regardingEntity, parameters,
            processId, processInstanceId, createFromEntity, relationship, ...rest } = args
    const windowOptions = {openInNewWindow, width, height }

    if(args.entityName === "annotation") {

        const newP = Object.assign({}, parameters,
                                   regardingEntity ? {
                                       pId: `{${regardingEntity.id}}`,
                                       pType: regardingEntity.entityName
                                   }: {})
        return {
            entityName: "annotation",
            entityId,
            parameters: newP,
            windowOptions,
        }
    }
    // Assemble args for non-annotations...
    const newP = Object.assign({}, parameters,
                               regardingEntity ? {
                                   // these work on web client, but not uci
                                   regardingobjectid: `{${regardingEntity.id}}`,
                                   regardingobjectidname: regardingEntity.name,
                                   regardingobjecttypecode: regardingEntity.entityName,
                               }: {})
    return {
        entityName,
        entityId,
        parameters: newP,
        windowOptions,
        processId,
        processInstanceId,
        createFromEntity,
        relationship
    }
}

/** Assemble args for UCI clients. They handle regarding differently. */
export const uciCreateActivityArgsBuilder = (args: CreateActivityOpenFormArgs): OpenFormAPIArgs => {
    const { openInNewWindow, width, height, entityName, entityId, useQuickCreateForm,
            regardingEntity, parameters, processId, processInstanceId, createFromEntity, relationship, ...rest } = args
    const windowOptions = {openInNewWindow, width, height }

    const newP = Object.assign({}, parameters,
                               regardingEntity ? {
                                   regardingobjectid: JSON.stringify({
                                       id: regardingEntity.id,
                                       name: regardingEntity.name,
                                       entityType: regardingEntity.entityName
                                   })
                               }: {})
    return {
        entityName,
        entityId,
        parameters: newP,
        windowOptions,
        processId,
        processInstanceId,
        createFromEntity,
        relationship
    }
}

/** Use an internal API to use the write builder method. */
export const defaultCreateActivityArgsBuilder = (xrm: XRM, args: CreateActivityOpenFormArgs): OpenFormAPIArgs => {
    console.log("isUci", isUci(xrm))
    if(isUci(xrm)) return uciCreateActivityArgsBuilder(args)
    return createActivityArgsBuilder(args)
}
