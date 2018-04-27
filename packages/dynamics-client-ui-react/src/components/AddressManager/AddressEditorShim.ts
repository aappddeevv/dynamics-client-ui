import { run } from "./AddressEditorRunner"
import "@aappddeevv/dynamics-client-ui/lib/fabric/ensureIcons"

if (process.env.NODE_ENV !== "production" && typeof runmain !== "undefined" && runmain) {
    window.addEventListener("load", () => {
        run({ target: document.getElementById("container") })
    })
}