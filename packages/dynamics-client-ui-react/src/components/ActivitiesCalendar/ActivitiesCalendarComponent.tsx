import * as React from "react"
import { connect } from "react-redux"
const _styles = require("!!style-loader!css-loader!react-big-calendar/lib/css/react-big-calendar.css")
import { css } from "office-ui-fabric-react/lib/Utilities"
import BigCalendar from "react-big-calendar"
import * as moment from "moment"
import { CalendarViewActions as CalActions } from "./redux"
import { Actions as VActions } from "../ActivitiesReader/redux"
import ControlPanelR from "./ControlPanel"
import * as selectors from "../ActivitiesReader/redux/selectors"
import * as Utils from "@aappddeevv/dynamics-client-ui/lib/Dynamics/Utils"
import * as colors from "@aappddeevv/dynamics-client-ui/lib/Dynamics/colors"
import { ActivityItem } from "../ActivitiesReader/datasources/datamodel"
import { colorForUser } from "./UserSelection"
import {
    MSTP, MDTP, OwnProps,
    ActivitiesCalendarComponentProps,
    ActivitiesCalendarComponentStyles,
    ActivitiesCalendarComponentClassNames,
} from "./ActivitiesCalendarComponent.types"
import { getStyles } from "./ActivitiesCalendarComponent.styles"
import {
    getClassNames
} from "./ActivitiesCalendarComponent.classNames"

const mapStateToProps = (state, props): MSTP => ({
    events: state.data.activities,
    view: state.calendarView.view,
    date: state.calendarView.date,
    selected: selectors.selectedEntities(state),
    allUsers: state.filter.allOwners,
})

const mapDispatchToProps = (dispatch, props) => ({
    onView: v => dispatch(CalActions.setView(v)),
    onNavigate: (date, view) => dispatch(CalActions.updateCalendarDate(date, view)),
    onSelectEvent: item => dispatch(VActions.View.selectIds(item.id || null)),
})

export interface State {
    startHour: Date
    endHour: Date
}

BigCalendar.momentLocalizer(moment)

export class ActivitiesCalendarComponent extends
    React.Component<ActivitiesCalendarComponentProps, State> {

    private _classNames: ActivitiesCalendarComponentClassNames
    private _styles: ActivitiesCalendarComponentStyles

    constructor(props) {
        super(props)
        this.state = {
            startHour: moment().set("hour", 5).set("minute", 0).toDate(),
            endHour: moment().set("hour", 23).set("minute", 0).toDate(),
        }
    }

    public render() {
        // todo: Don't use this ...rest thing for splatting out all other props...vey unsafe...
        const { view, date, selected, allUsers,
            className, styles, onNavigate, ...rest } = this.props
        const selectedActivity = Utils.firstOrElse<ActivityItem, undefined>(selected, undefined)

        this._styles = getStyles(styles)
        this._classNames = this.props.getClassNames ?
            this.props.getClassNames(this._styles) :
            getClassNames(this._styles, className)
        return (
            <div className={this._classNames.root}>
                <BigCalendar
                    className={this._classNames.calendar}
                    view={view}
                    date={date.toDate()}
                    popup={true}
                    min={this.state.startHour}
                    max={this.state.endHour}
                    toolbar={true}
                    titleAccessor="subject"
                    startAccessor="start"
                    endAccessor="end"
                    tooltipAccessor="description"
                    eventPropGetter={(event, start, end, isSelected) => {
                        return toColor((event as any).ownerid, allUsers, isSelected)
                    }}
                    allDayAccessor={() => false}
                    onView={newView => onNavigate(date, newView)}
                    onNavigate={d => onNavigate(d, view)}
                    {...rest}
                />
                <ControlPanelR
                    {...rest}
                    activity={selectedActivity}
                    classNames={{
                        root: this._classNames.controlPanel,
                        tab: this._classNames.tab,
                        userSelection: this._classNames.userSelection,
                        detailDisplay: this._classNames.detailDisplay,
                    }}
                />
            </div>
        )
    }
}

export const ActivitiesCalendarComponentR =
    connect<Partial<MSTP>, Partial<MDTP>, Partial<ActivitiesCalendarComponentProps>>(
        mapStateToProps, mapDispatchToProps)(ActivitiesCalendarComponent)

/**
 * Return a style for a specific user. Most importantly, sets
 * that sets the background color based on a hash of the users name.
 */
export function toColor(id, users, isSelected) {
    const user = users.find(u => u.id === id)
    const color = colorForUser(user)
    const backgroundColor = isSelected ? "black" : color
    const borderColor = isSelected ? "black" :
        colors.shadeBlendConvert(-0.75, backgroundColor)
    return {
        style: {
            backgroundColor,
            borderColor,
        },
    }
}

export const standardColorHighlighted = "#265985"
