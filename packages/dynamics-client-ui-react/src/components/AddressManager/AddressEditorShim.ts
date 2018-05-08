import { run } from "./AddressEditorRunner"

// even if you write your own runner, we should probably move this to AddressEditorRunner.
import "@aappddeevv/dynamics-client-ui/lib/fabric/ensureIcons"

if (process.env.NODE_ENV !== "production" && typeof runmain !== "undefined" && runmain) {
    window.addEventListener("load", () => {
        run({ target: document.getElementById("container") })
    })
}