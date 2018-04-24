/** 
 * Xrm related types and things. Builds on @types/xrm.
 */

export interface Internal {
    isUci(): boolean
}

/**
 * Xrm as a type called XRM. @types/xrm seems to keep Xrm
 * as only a global variable but we would like to pass
 * it around as a value as you may obtain Xrm from different
 * window scopes. We use XRM as the alias because too
 * many Xrm looking names looks goofy and XrmStatic looks
 * goofy as well.
 */
export interface XRM extends Xrm.XrmStatic {
    Internal: Internal
}
