import * as React from "react"

export interface CrmTableProps {
    rowKey: string
    contactId?: string | null
    dataSource?: any
    data: Array<any>
    sortingColumns?: any
    columnGenerator: any
    className?: string
    selectedId?: string | null
    selectedRowIndex?: number | null
    onSelectId?: (id: string) => void
}

declare class CrmTable extends React.Component<CrmTableProps, any> {
    constructor(props: CrmTableProps)
    render(): JSX.Element
}

// export all forms of CrmTable, including class
export namespace CrmTable {
}
