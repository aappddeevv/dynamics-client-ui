/**
 * Default menu builders for activity views.
 * Data model is from office-ui-fabric-react ContextualMenu.
 * You can build all the default menus provided in this module or
 * mix and match.
 */
import * as React from "react"
import { Dispatch, Action } from "redux"
import R = require("ramda")
import { ContextualMenuItemType, IContextualMenuItem } from "office-ui-fabric-react/lib/ContextualMenu"
import { RadioSelect } from "@aappddeevv/dynamics-client-ui/lib/Components/RadioSelect"
import CheckBoxList from "@aappddeevv/dynamics-client-ui/lib/Components/CheckBoxList"
import { Actions } from "./redux"
import { DataAction } from "./redux/data"
import { FilterAction } from "./redux/filter"

export { DataAction, FilterAction }

/** 
 * onNew called with (value, option, evt)  from options. Option's value should be the 
 * logical name of the activity to create.
 */
export function NewActivityMenu(options, onNew, disabled = false): IContextualMenuItem {
    const curriedOnNew = (value, opt) => !R.isNil(onNew) ? (e) => onNew(value, opt, e) : null
    const items = options.map(o =>
        ({
            ...itemToOfficeMenuModel({ ...o }),
            onClick: curriedOnNew(o.value, o),
        }))
    return {
        "data-automation-id": "new",
        iconProps: { iconName: "Add" },
        name: "New",
        key: "new",
        disabled,
        subMenuProps: {
            items,
        },
    }
}

/** Options must be in which format? */
export const ActivityTypesMenu = (options, selected, selectAll, deselectAll, selectOne, deselectOne) => ({
    key: "activityTypes",
    name: "Activity Types",
    iconProps: { iconName: "Filter" },
    subMenuProps: {
        items: [
            { key: "selectAll", name: "Select All", onClick: selectAll },
            { key: "deselect", name: "Deselect All", onClick: deselectAll },
            { key: "divider1", itemType: ContextualMenuItemType.Divider },
            {
                key: "types",
                name: "types",
                items: options || [],
                selected,
                onCheckboxChange: (value, checked, ev) => (checked ? selectOne(value) : deselectOne(value)),
                onRender: renderCheckboxList,
            }
        ]
    }
})

export const StatusTypesMenu = (options, selected, selectAll, deselectAll, selectOne, deselectOne) => ({
    key: "status",
    name: "Status",
    iconProps: { iconName: "Filter" },
    subMenuProps: {
        items: [
            { key: "selectAll", name: "Select All", onClick: selectAll },
            { key: "deselectAll", name: "Deselect All", onClick: deselectAll },
            {
                key: "divider1", itemType: ContextualMenuItemType.Divider,
            },
            {
                key: "status",
                name: "status",
                items: options || [],
                selected,
                onCheckboxChange: (value, checked, ev) => (checked ? selectOne(value) : deselectOne(value)),
                onRender: renderCheckboxList,
            }
        ]
    }
})

export const IncludeMenu = (options, selected, selectAll, deselectAll, selectOne, deselectOne) => ({
    key: "include",
    name: "Include",
    iconProps: { iconName: "Filter" },
    subMenuProps: {
        items: [
            { key: "selectAll", name: "Select All", onClick: selectAll },
            { key: "clear", name: "Deselect All", onClick: deselectAll },
            { key: "divider1", itemType: ContextualMenuItemType.Divider },
            {
                key: "includes",
                name: "includes",
                items: options || [],
                selected,
                onCheckboxChange: (value, checked, ev) => (checked ? selectOne(value) : deselectOne(value)),
                onRender: renderCheckboxList,
            }
        ]
    }
})

export const DateRangeMenu = (attrs, ranges, selectedAttr, setAttr, selectedRange, setRange) => ({
    key: "dateRange",
    name: "Date Range",
    iconProps: { iconName: "Filter" },
    subMenuProps: {
        items: [
            {
                key: "attrHeader",
                name: "Date Attribute",
                itemType: ContextualMenuItemType.Header,
            },
            {
                key: "attr",
                name: "attr",
                items: attrs || [],
                selectedValue: selectedAttr,
                onRadioChange: setAttr,
                onRender: renderRadioSelect,
            },
            {
                key: "divider1",
                itemType: ContextualMenuItemType.Divider,
            },
            {
                key: "rangeHeader",
                name: "Date Range",
                itemType: ContextualMenuItemType.Header,
            },
            {
                key: "range",
                name: "range",
                items: ranges || [],
                selectedValue: selectedRange,
                onRadioChange: setRange,
                onRender: renderRadioSelect,
            }]
    }
})

export const OwnerMenu = (isChecked, toggle) => ({
    key: "owner",
    name: "Yours Only",
    iconProps: { iconName: "Filter" },
    canCheck: true,
    isChecked: isChecked || false,
    onClick: () => toggle(!isChecked),
})

/** Add {key, text} from {value, label}. Does not remove keys. Mutates input. */
export function toOfficeFabricModel(items: Array<any>): Array<IContextualMenuItem> {
    return items.map(i => itemToOfficeMenuModel(i))
}

/** Use (value,label) to create (key,text) if they don't exist. */
export function itemToOfficeMenuModel(item): IContextualMenuItem {
    if (!item.key && item.value) item.key = item.value;
    if (!item.name && item.label) item.name = item.label;
    return item;
}

/**
 * Renders a list of controlled `Checkbox`s usable in a fabric command bar menu.
 * @param item.items {value,label} or {key,text} pairs.
 * @param item.selected Array of value/key initial selections.
 * @param item.onCheckboxChange Passed to individual Checkbox's when they change.
 *   It's not called onChange to avoid potential conflicts.
 */
export function renderCheckboxList(item) {
    // className="ms-ContextualMenu-item"
    return (
        <CheckBoxList
            key={item.key}
            options={item.items}
            checked={item.selected}
            onChange={item.onCheckboxChange}
        />
    )
}

/**
 * Renders a radio list.
 * @param item.key react key
 * @param item.name name
 * @param item.items Array of (key, value) items.
 * @param item.selectedValue Value contained in items.
 * @param item.onRadioChange Function value => undefined.
 */
export function renderRadioSelect(item) {
    return (
        <RadioSelect
            key={item.key}
            name={item.name}
            options={item.items}
            selectedValue={item.selectedValue}
            onChange={item.onRadioChange}
        />
    );
}

/**
 * Default menu items in a specific order. Only adds menu items if properties
 * are present to provide them displayable content even
 * without the required object actions. See `DefaultMenuItemsByMenu`.
 * @return Array of the default menu items.
 */
export function DefaultMenuItems(props): Array<IContextualMenuItem> {
    const {
        newActivityMenu,
        activityTypesMenu,
        yoursMenu,
        statusTypesMenu,
        dateRangeMenu } = DefaultMenuItemsByMenu(props)
    return ([
        activityTypesMenu,
        yoursMenu,
        statusTypesMenu,
        /*        IncludeMenu(props.filter.includes,
           props.filter.include,
           props.selectAllIncludes,
           props.deselectAllIncludes,
           props.selectOneInclude,
           props.deselectOneInclude),
         */
        dateRangeMenu,
        newActivityMenu,
    ].filter(m => m !== null)) as Array<IContextualMenuItem>
}

/**
 * Must have props.filter (filter state slice) to provide reference data
 * and many different properties for each specific callback.
 * Read the source! Most menuse are only defined if the reference
 * data is available, otherwise there is nothing to render!
 * Returns a map of objects that can be used in Office Fabric menus.
 * Menus are not built if their needed properties (reference data & actions)
 * are not present. This function is intentionally designed to break
 * apart the state filter slice and call the APIs that require the
 * parameters explicitly. If not enough props are provided, individual
 * items in the return object could be null.
 *
 * See `mapDispatchToProps` in this module to generate many of the "dispatch"
 * props needed in the props parameter e.g.
 * `DefaultMenuItemsByMenu({...mapDispatchToProps(dispatch), filter })`
 */
export function DefaultMenuItemsByMenu(props) {
    const activityTypesMenu = (props.filter && props.filter.types) ?
        ActivityTypesMenu(props.filter.types,
            props.filter.selectedTypes,
            props.selectAllActivityTypes,
            props.deselectAllActivityTypes,
            props.selectOneActivityType,
            props.deselectOneActivityType) :
        null

    const statusTypesMenu = (props.filter && props.filter.states) ?
        StatusTypesMenu(props.filter.states,
            props.filter.state,
            props.selectAllStates,
            props.deselectAllStates,
            props.selectOneState,
            props.deselectOneState) :
        null

    const dateRangeMenu = (props.filter && props.filter.attributes && props.filter.ranges) ?
        DateRangeMenu(props.filter.attributes, props.filter.ranges,
            props.filter.attribute, props.setDateAttr,
            props.filter.range, props.setRange) :
        null

    const yoursMenu = (props.filter) ?
        OwnerMenu(props.filter.yoursOnly, props.setYoursOnly) :
        null

    // Can only be active if when you create a new activity the regarding can be set.
    // Regarding would come from the entity id.
    const newActivityMenu = (props.filter && props.filter.types) ?
        NewActivityMenu(props.filter.types.filter(t => {
            // huh? isn't this just !!t.allowNew
            if (typeof t.allowNew === "boolean") return t.allowNew
            return true
        }),
            props.onNew,
            props.entityId ? false : true) :
        null

    return {
        activityTypesMenu,
        statusTypesMenu,
        dateRangeMenu,
        yoursMenu,
        newActivityMenu,
    }
}

/**
 * Maps dispatch to dispatches for all menus defined in this file.
 * There is no default event handler for onNew associated with the new
 * activity menu since that requires an expansive set of parameters
 * to setup correctly. The return value is explicitly designed to be
 * added to your own mapDispatchToProps or passed as *part* of the
 * properties you pass to `DefaultMenuItemsByMenu`.
 */
export function mapDispatchToProps(dispatch: Dispatch<Action>) {
    return {
        selectAllIncludes: () => dispatch(Actions.Filter.includes.SET_ALL()),
        deselectAllIncludes: () => dispatch(Actions.Filter.includes.CLEAR()),
        selectOneInclude: (value) => dispatch(Actions.Filter.includes.ADD(value)),
        deselectOneInclude: (value) => dispatch(Actions.Filter.includes.REMOVE(value)),

        selectAllStates: () => dispatch(Actions.Filter.changeStateFilter(Actions.Filter.states.SET_ALL())),
        deselectAllStates: () => dispatch(Actions.Filter.changeStateFilter(Actions.Filter.states.CLEAR())),
        selectOneState: (value) => dispatch(Actions.Filter.changeStateFilter(Actions.Filter.states.ADD(value))),
        deselectOneState: (value) => dispatch(Actions.Filter.changeStateFilter(Actions.Filter.states.REMOVE(value))),

        selectAllActivityTypes: () => dispatch(Actions.Filter.changeActivityTypesFilter(Actions.Filter.activityTypes.SET_ALL())),
        deselectAllActivityTypes: () => dispatch(Actions.Filter.changeActivityTypesFilter(Actions.Filter.activityTypes.CLEAR())),
        selectOneActivityType: (value) => dispatch(Actions.Filter.changeActivityTypesFilter(Actions.Filter.activityTypes.ADD(value))),
        deselectOneActivityType: (value) => dispatch(Actions.Filter.changeActivityTypesFilter(Actions.Filter.activityTypes.REMOVE(value))),

        setDateAttr: (value) => dispatch(Actions.Filter.changeDateFilter(Actions.Filter.dateAttrs.SET(value))),
        setRange: (value) => dispatch(Actions.Filter.changeDateFilter(Actions.Filter.ranges.SET(value))),
        //setRanges: r => dispatch(VA.changeDateFilter(VA.ranges.SET(r))),
        //setDateAttrs: d => dispatch(VA.changeDateFilter(VA.dateAttrs.SET(d))),

        setYoursOnly: (isChecked) => dispatch(Actions.Filter.changeYoursOnlyFilter(Actions.Filter.setYoursOnly(isChecked))),

        onRefresh: () => dispatch(Actions.Data.requestEntities()),
    }
}
