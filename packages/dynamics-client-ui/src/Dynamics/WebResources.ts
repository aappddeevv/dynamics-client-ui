/**
 * Hack module to handle WebResource handling problems in both
 * the unified and traditional web UI. Includes functions when
 * shimming or working with WebResource initialization processing.
 */
import {CLIENT, DEBUG} from "BuildSettings"

/** 
 * In targetWindow (defaults to this window), search for an iframe with
 * the specific id and return the attribute.
 */
export function getAttributeFromIFrame<T=any>(frameId: string, attribute: string,
                                         targetWindow: Window = window): T | null
{
    for(let i=0; i<targetWindow.frames.length; i++) {
        const w = targetWindow.frames[i]
        const fel = w.frameElement
        if(fel.id === frameId) {
            if(typeof window[attribute] !== "undefined") return window[attribute]
            return null
        }
    }
    return null
}

/** Return the frame of this window, which is an iframe. */
export function findIFrame(): Element {
    return window.frameElement
}

/** Find the parent element (whatever it is) of this iframe. */
export function findParentOfIFrame(): HTMLElement | null {
    return findIFrame().parentElement
}

/**
 * Set this iframe's display style to none. visibility would still 
 * leave it participating in layout calculations.
 */ 
export function setDisplayNoneForThisIFrame(): void {
    // @ts-ignore
    findIFrame().style.display = "none"
}

/** 
 * Return WEB|UCI|null based on the iframe parent layout. You can also use
 * Utils.isUci. This is highly hacky and probably subject to change. Use
 * your own if you can.
 */
export function guessLayout(): "WEB" | "UNIFIED" | null {
    var p = findParentOfIFrame();
    if (p) {
        switch (p.nodeName) {
            case "SPAN": return "WEB"
            case "DIV": return "UNIFIED"
        }
    }
    return null
}

/**
 * Set multliple styles on a an HTMLELement.
 */
function setStyle(el: HTMLElement, propertyObject: Record<string,any>) {
    for (var property in propertyObject) {
        el.style[property] = propertyObject[property]
    }
}

export interface AdjustProps {
    [styleName: string]: string
}

export const uciFormLineProps: AdjustProps = {
    borderBottom: "1px solid rgb(216, 216, 216)",
    flexDirection: "row",
    minHeight: "49px",
    marginLeft: "23px",
    height: "49px"
}

/**
 * Adjust parent object assuming "this" el is
 * a web resource. Do nothing if layout is not UNIFIED. Uses "guessLayout".
 * Write your own adjustment function if you do not like this version.
 */
export function adjustFormLineForUci(props: AdjustProps = uciFormLineProps) {
    if (guessLayout() === "UNIFIED") {
        const p = findParentOfIFrame()
        if(p) setStyle(p, props)
    }
}

/** 
 * Search up the parent, starting at `start`'s parent, until
 * predicate is true or return null.
 */
export function findParent(start: Node | null, predicate: (el: Node) => boolean): Node | null {
    if (!start) return null
    let current = start.parentNode
    while (current != null) {
        if (predicate(current)) return current
        current = current.parentNode
    }
    return null
}

/**
 * Given a target, if its is an <iframe>, create a new target
 * as a peer that takes into account UCI or non-UCI interfaces. Otherwise,
 * find the target if its a string or return it directly if its already
 * an HTMLElement (of any kind except iframe). `newProps` is used if a 
 * new element needs to be created otherwise a simple div with no id or
 * classname is created.
 */
export function getOrMakeTarget(target: string | HTMLElement | null,
                                newProps?: {
                                    div?: string,
                                    id?: string,
                                    className?: string}): HTMLElement | null
{
    if(target === null) return null
    else if (typeof target === "string") {
        const el = document.getElementById(target)
        if(el && el.nodeName !== "IFRAME") return el
    }
    else if (target instanceof HTMLElement && target.nodeName !== "IFRAME") return target

    // 2nd DOM traversal
    const blah: HTMLElement | null = typeof target === "string" ?
                                     document.getElementById(target): target
    
    if(blah && blah.nodeName === "IFRAME") {
        const parent = findParent(blah, n => n.nodeName === "TD")
        if(DEBUG) console.log("getOrMakeTarget.parent", parent)
        if(parent) {
            if(DEBUG) console.log("getOrMakeTarget: Adding new element")
            const el = newProps && newProps.div ? newProps.div : "div"
            const portalTarget = document.createElement(el)
            if(newProps && newProps.id) portalTarget.id = newProps.id
            if(newProps && newProps.className) portalTarget.className = newProps.className
            parent.appendChild(portalTarget)
            return portalTarget
        }
    }
    else if(blah !== null) return blah
    return null
}

/**
 * Move stylesheets via importNode and appendChil from source to target
 * documents.
 */
export function moveStylesheetsToParent(source: Document = document,
                                        target: Document = window.parent.document) {
    if (DEBUG) console.log("copyStylesheetsToParent")
    const parentss: StyleSheetList = window.parent.document.styleSheets
    const currentss: StyleSheetList = document.styleSheets
    if (DEBUG)
        for (const ss in currentss) console.log("stylesheet", currentss[ss])
    for (let i = 0; i < currentss.length; i++) {
        const currentCssSS = currentss[i] as CSSStyleSheet
        if (currentCssSS.href !== null) continue; // only locally inserted styles, not web loaded

        const n = window.parent.document.importNode(currentCssSS.ownerNode, true)
        window.parent.document.head.appendChild(n)
    }
    // print out parent SS
    if (DEBUG)
        for (let i = 0; i < parentss.length; i++) console.log(`parent ss ${i}`, parentss[i])
    if (DEBUG) console.log("parent head", window.parent.document.head)
}

// ???, anything special to *always* do when this module is loaded?
// and CLIENT is set in BuildSetting vs say, Utils.isUci.
if(CLIENT === "UNIFIED") {
    // unified only stuff here
}

