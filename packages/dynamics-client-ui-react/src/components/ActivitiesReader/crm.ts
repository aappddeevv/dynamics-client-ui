//
// Dynamics CRM specific content
//

/**
 * Icon names
 */
export const activityIcons = [
    {
        image: "/_imgs/ico_16_4212.gif",
        value: "task",
    }, {
        image: "/_imgs/ico_16_4204.gif",
        value: "fax",
    }, {
        image: "/_imgs/ico_16_4210.gif",
        value: "phonecall",
    }, {
        image: "/_imgs/ico_16_4202.gif",
        value: "email",
    }, {
        image: "/_imgs/ico_16_4207.gif",
        value: "letter",
    }, {
        image: "/_imgs/ico_16_4201.gif",
        value: "appointment",
    }, {
        image: "/_imgs/ico_16_4401.gif",
        value: "campaignresponse",
    }, {
        image: "/_imgs/ico_16_4251.gif",
        value: "recurringappointmentmaster",
    },
]

export const annotationsList = [
    {
        label: "Note",
        image: null,
        value: "annotation",
        allowNew: true,
    },
]

/** Value must be in the target data model. */
export const dateFilterOptions: Array<{ label: string, value: string, default?: boolean }> = [
    {
        label: "Created On",
        value: "createdon",
        default: true,
    }, {
        label: "Modified On",
        value: "modifiedon",
    }, {
        label: "Start Date",
        value: "start", // dynamics feld is scheduledstart
    },
];

// TODO: Each item should have a function that returns the range as two dates.
export const dateRangeOptions: Array<{ label: string, value: number, default?: boolean }> = [
    {
        label: "All",
        value: 0,
        default: true,
    },
    {
        label: "Last 12 Months",
        value: 1,
    }, {
        label: "Last 6 Months",
        value: 2,
    }, {
        label: "Last 90 Days",
        value: 3,
    }, {
        label: "Last 30 Days",
        value: 4,
    }, {
        label: "Last 7 Days",
        value: 5,
    }, {
        label: "Yesterday",
        value: 6,
    }, {
        label: "Today",
        value: 7,
    },
];

export const includeOptions: Array<{ label: string, value: number, default?: boolean }> = [
    {
        label: "This Record Only",
        value: 1,
    }, {
        label: "Related Records",
        value: 2,
        default: true,
    },
    {
        label: "From Connections",
        value: 3,
    },
];

/** Values must be statecode. */
export const stateOptions = [
    { label: "Open", value: 0 },
    { label: "Completed", value: 1 },
];

/**
 * These are consistent for activities although not all
 * activites have all these state codes. These are *not*
 * status codes.
 */
export const activityStateOptions = [
    { label: "Open", value: 0 },
    { label: "Completed", value: 1 },
    { label: "Canceled", value: 2 },
    { label: "Scheduled", value: 3 },
];
