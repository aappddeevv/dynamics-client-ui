/** Utilities for working with FetchXml. */


export enum Operator {
    eq = "eq",
    neq = "neq",
    ne = "ne",
    gt = "gt",
    ge = "ge",
    le = "le",
    lt = "lt",
    like = "like",
    notLike = "not-like",
    _in = "in",
    notIn = "not-in",
    between = "between",
    notBetween = "not-between",
    _null = "null",
    notNull = "not-null",
    // ...
    beginsWith = "begins-with",
    notBeginWith = "not-begin-with",
    endsWith = "ends-with",
    notEndWith = "not-end-with",
    under = "under",
    eqOrUnder = "eq-or-under",
    notUnder = "notUnder",
    above = "above",
    eqOrAbove = "eq-or-above",
}

/*
   <xs:enumeration value="eq" />
   <xs:enumeration value="neq" />
   <xs:enumeration value="ne" />
   <xs:enumeration value="gt" />
   <xs:enumeration value="ge" />
   <xs:enumeration value="le" />
   <xs:enumeration value="lt" />
   <xs:enumeration value="like" />
   <xs:enumeration value="not-like" />
   <xs:enumeration value="in" />
   <xs:enumeration value="not-in" />
   <xs:enumeration value="between" />
   <xs:enumeration value="not-between" />
   <xs:enumeration value="null" />
   <xs:enumeration value="not-null" />
   <xs:enumeration value="yesterday" />
   <xs:enumeration value="today" />
   <xs:enumeration value="tomorrow" />
   <xs:enumeration value="last-seven-days" />
   <xs:enumeration value="next-seven-days" />
   <xs:enumeration value="last-week" />
   <xs:enumeration value="this-week" />
   <xs:enumeration value="next-week" />
   <xs:enumeration value="last-month" />
   <xs:enumeration value="this-month" />
   <xs:enumeration value="next-month" />
   <xs:enumeration value="on" />
   <xs:enumeration value="on-or-before" />
   <xs:enumeration value="on-or-after" />
   <xs:enumeration value="last-year" />
   <xs:enumeration value="this-year" />
   <xs:enumeration value="next-year" />
   <xs:enumeration value="last-x-hours" />
   <xs:enumeration value="next-x-hours" />
   <xs:enumeration value="last-x-days" />
   <xs:enumeration value="next-x-days" />
   <xs:enumeration value="last-x-weeks" />
   <xs:enumeration value="next-x-weeks" />
   <xs:enumeration value="last-x-months" />
   <xs:enumeration value="next-x-months" />
   <xs:enumeration value="olderthan-x-months" />
   <xs:enumeration value="olderthan-x-years" />
   <xs:enumeration value="olderthan-x-weeks" />
   <xs:enumeration value="olderthan-x-days" />
   <xs:enumeration value="olderthan-x-hours" />
   <xs:enumeration value="olderthan-x-minutes" />
   <xs:enumeration value="last-x-years" />
   <xs:enumeration value="next-x-years" />
   <xs:enumeration value="eq-userid" />
   <xs:enumeration value="ne-userid" />
   <xs:enumeration value="eq-userteams" />
   <xs:enumeration value="eq-useroruserteams" />
   <xs:enumeration value="eq-useroruserhierarchy" />
   <xs:enumeration value="eq-useroruserhierarchyandteams" />
   <xs:enumeration value="eq-businessid" />
   <xs:enumeration value="ne-businessid" />
   <xs:enumeration value="eq-userlanguage" />
   <xs:enumeration value="this-fiscal-year" />
   <xs:enumeration value="this-fiscal-period" />
   <xs:enumeration value="next-fiscal-year" />
   <xs:enumeration value="next-fiscal-period" />
   <xs:enumeration value="last-fiscal-year" />
   <xs:enumeration value="last-fiscal-period" />
   <xs:enumeration value="last-x-fiscal-years" />
   <xs:enumeration value="last-x-fiscal-periods" />
   <xs:enumeration value="next-x-fiscal-years" />
   <xs:enumeration value="next-x-fiscal-periods" />
   <xs:enumeration value="in-fiscal-year" />
   <xs:enumeration value="in-fiscal-period" />
   <xs:enumeration value="in-fiscal-period-and-year" />
   <xs:enumeration value="in-or-before-fiscal-period-and-year" />
   <xs:enumeration value="in-or-after-fiscal-period-and-year" />
   <xs:enumeration value="begins-with" />
   <xs:enumeration value="not-begin-with" />
   <xs:enumeration value="ends-with" />
   <xs:enumeration value="not-end-with" />
   <xs:enumeration value="under"/>
   <xs:enumeration value="eq-or-under" />
   <xs:enumeration value="not-under"/>
   <xs:enumeration value="above" />
   <xs:enumeration value="eq-or-above" />
 */

/** OperatorMetadata.argCount = UNLIMITED_ARGS means list. */
export const UNLIMITED_ARGS = -1

export interface OperatorMetadata {
    /** Enumeration name in fetchxml xsd */
    op: Operator
    /** Number of arguments needed for operator. */
    argCount: number
    /** Javascript that it applies to, can be multiple. Values are returned from typeof. */
    appliesTo: string | Array<string>
    /** Non-intln display name. */
    displayName?: string
    /** Description. */
    description?: string
}

export const OperatorMetadata: Array<OperatorMetadata> = [
    {op: Operator.eq, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator.neq, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.ne, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.gt, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator.ge, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator.le, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator.lt, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator.like, argCount: 1, appliesTo: ["string"]},
    {op: Operator.notLike, argCount: 1, appliesTo: ["string"]},
    {op: Operator._in, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.notIn, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.between, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator.notBetween, argCount: 2, appliesTo: ["number", "string"]},
    {op: Operator._null, argCount: 0, appliesTo: ["number", "string"]},
    {op: Operator.notNull, argCount: 0, appliesTo: ["number", "string"]},
    // ...
    {op: Operator.beginsWith, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.notBeginWith, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.endsWith, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.notEndWith, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.under, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.eqOrUnder, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.notUnder, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.above, argCount: 1, appliesTo: ["number", "string"]},
    {op: Operator.eqOrAbove, argCount: 1, appliesTo: ["number", "string"]},
]
