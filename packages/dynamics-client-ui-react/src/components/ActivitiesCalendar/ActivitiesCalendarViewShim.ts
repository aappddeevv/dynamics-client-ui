import { run } from "./ActivitiesCalendarView"

//
// shim support specifically for the ActivitiesCalendarView.
//
if (process.env.NODE_ENV !== "production" && typeof runmain !== "undefined" && runmain) {
    window.addEventListener("load", () => {
        run({ target: document.getElementById("container") })
    })
}