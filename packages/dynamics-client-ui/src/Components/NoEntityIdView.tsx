/** A simple message view .*/

import * as React from "react"

export function NoEntityIdView({message}: { message?: string}) {
    return(
        <div className="noEntityIdView">
            { message ? message :
              "Save entity before working with this area."
            }
        </div>
    )
}

export default NoEntityIdView
