/** Compatibility module between versions. */

import {CLIENT} from "BuildSettings"
import { XRM } from "./xrm"

/** Open an entity form. */
export function openForm(xrm: XRM, entityName: string, entityId: string,
                         parameters: any, windowParameters: any): void
{
    if(CLIENT !== "UNIFIED") {                             
        xrm.Utility.openEntityForm(entityName, entityId, parameters, windowParameters)
    }
    else {
        const r = parameters
        const n = windowParameters
        const i = {
            entityName: entityName,
            entityId: entityId,
            formId: r && r.formid ? r.formid : void 0,
            navbar: r && r.navbar ? r.navbar : void 0,
            cmdbar: !(!r || "true" !== r.cmdbar),
            width: n && n.width ? n.width : void 0,
            height: n && n.height ? n.height : void 0,
            openInNewWindow: !(!n || !n.openInNewWindow) && n.openInNewWindow
        }
        xrm.Navigation.openForm(i, parameters)
    }

}

/** Example:
https://blah.crm.dynamics.com/main.aspx?appid=7a590878-c6aa-e711-a94e-000d3a328ed9&pagetype=entityrecord&etn=contact&id=41e03838-e8a9-e711-a94e-000d3a328ed9&formid=af9e8c09-73d6-4e97-9704-6dea31cb3446
**/

/** Open a form using window.open() method. */
export function openFormUsingWindow(entityName: string, entityId: string, parameters?:object) {

    const args = {
        pagetype: "entityrecord",
        id: `{${entityId}}`,
        etn: entityName,
        navbar: "on",
        cmdbar: "on",
    }

    // removed toolbar and location to force into the same window (as a tab) vs new window
    //const features = "menubar=yes,scrollbar=yes,resizable=yes,status=no,height=1000,width=1000"
    const features=""
    // if add extraqs, don't forget to use encodeURIComponent(...) on them, separated by '&'
    window.open(`/main.aspx?etn=${entityName}&pagetype=entityrecord&id=${entityId}`,
                "_blank", features, false)
}

// appid=7a590878-c6aa-e711-a94e-000d3a328ed9
