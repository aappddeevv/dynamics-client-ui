import { IStyle } from "office-ui-fabric-react/lib/Styling"
import { ActivityItem } from "../ActivitiesReader/datasources/datamodel"
import * as moment from "moment"

export interface MSTP {
    events: Array<ActivityItem>
    date: moment.Moment
    view: string
    [pname: string]: any
}

export interface MDTP {
    [pname: string]: any
}

export interface OwnProps {
    className?: string | null
    styles?: ActivitiesCalendarComponentStyles
    /** Get classnames passed to ActivitiesCalendarComponent. */
    getClassNames?:
    (styles: ActivitiesCalendarComponentStyles) => ActivitiesCalendarComponentClassNames
    /** more stuff? like what? */
    [pname: string]: any
}

export type ActivitiesCalendarComponentProps = OwnProps & MSTP & MDTP

export interface ActivitiesCalendarComponentClassNames {
    root: string
    calendar: string
    controlPanel: string
    tab: string
    detailDisplay: string
    userSelection: string
}

export interface ActivitiesCalendarComponentStyles {
    root?: IStyle
    calendar?: IStyle
    controlPanel?: IStyle
    tab?: IStyle
    detailDisplay?: IStyle
    userSelection?: IStyle
}