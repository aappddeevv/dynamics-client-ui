
import { run } from "./RelativityView"


// shim support
if (process.env.NODE_ENV !== "production" &&
    typeof runmain !== "undefined" && runmain) {
    window.addEventListener("load", () => {
        run({ target: document.getElementById("container") })
    })
}
