// Similar searches augments
import * as React from 'react'
import * as Table from 'reactabular-table'
import * as Sticky from 'reactabular-sticky'
import * as sort from 'sortabular'
import orderBy from 'lodash/orderBy'
const R = require("ramda")
import * as select from "selectabular"

const styles = require( "./CrmTable.css")
const fstyles = require( "../Dynamics/flexutilities.css")
const cx = require("classnames")
import Ellipsis from "./Ellipsis"
import { DEBUG } from "BuildSettings"

/**
 * Simple CRM styled table. Component can managed data state
 * or you can pass in data through props "data". The table can perform
 * local sorting so index based tracking of selection does not make
 * alot of sense.
 *
 * @param data Data for grid if dataSource is null.
 * @param columns Ready to go column array.
 * @param sortingColumns Sorting state per the manual.
 * @param dataSource Create a Promise that returns an array of data. Overrides `data`. Component
 *  will ignore data coming through props if dataSource is defined.
 * @param columnGenerator Function to generate columns. Called with sortable.
 * @param onSelectIndex Callback. Provides selected index. (only single selection?)
 * @param onSelectId Callback. Provides selected id, if defined.
 * @param selectedId Selected entity id or null.
 * @param {string} idAttr Attribute of an entities' identity i.e. "id" attribute. Defaults to "id".
 */
export class CrmTable extends React.Component {
    constructor(props) {
        super(props);

        const getSortingColumns = () => this.state.sortingColumns || [];
        
        this.state = {
            data: null,
            dataInternallyManaged: false, // whether data is internally managed
            columns: props.columns || [],
            dataSource: props.dataSource,
            sortingColumns: props.sortingColumns || {},
            originalSortingColumns: props.sortingColumns || {},
            columnGenerator: props.columnGenerator,
            strategy: props.strategy || sort.strategies.byProperty,
            getSortingColumns: props.getSortingColumns || getSortingColumns,
            sortable: props.sortable || null,
            resetable: props.resetable || null,
            idAttr: props.idAttr || "id"
        };

        this.tableHeader = null;
        this.tableBody = null;

        if(!this.state.sortable) {
            this.state.sortable = sort.sort({
                getSortingColumns: this.state.getSortingColumns,
                strategy: this.state.strategy,
                onSort: selectedColumn => {
                    this.setState({
                        sortingColumns: sort.byColumn({
                            sortingColumns: this.state.sortingColumns,
                            selectedColumn
                        })
                    })
                }
            });
        }

        if(!this.state.resetable) {
            this.state.resetable = sort.reset({
                event: 'onDoubleClick',
                getSortingColumns: this.state.getSortingColumns,
                onReset: ({sortingColumns}) => this.setState({sortingColumns}),
                strategy: this.state.strategy
            });
        }

        this.refreshData = this.refreshData.bind(this);
    }

    static defaultProps = {
        rowKey: "id",
        idAttr: "id"
    }

    /** Call from external scrollbar. */
    doScroll = (e) => {
        this.tableHeader.scrollLeft = e.target.scrollLeft
        this.tableBody.scrollLeft = e.target.scrollLeft
    }
    
    componentWillMount() {
        const gen = this.state.columnGenerator;
        if(gen) {
            //console.log("CrmTable: Generating columns");
            this.setState({columns: gen({
                getSortingColumns: this.state.getSortingColumns,
                strategy: this.state.strategy,
                sortable: this.state.sortable,
                resetable: this.state.resetable
            })});
        }
    }
    
    componentDidMount() {
        this.forceUpdate();
        this.refreshData();
    }

    refreshData() {
        if(this.state.dataSource) { 
            this.state.dataSource(this.state).then(data => {
                this.setState({data, dataInternallyManaged: true })
            }).catch(e => {
                // not sure the issue
                console.log("CrmTable: error obtaining data", e)
                this.setState({dataInternallyManaged: true})
            })
        }
    }

    render() {
        let { data, columns, sortingColumns, dataInternallyManaged} = this.state;
        if(!dataInternallyManaged) {
            data = this.props.data || data
        }
        const { onSelectIndex, onSelectId, selectedId, className } = this.props

        // add some non-invasive properties to all columns if they render it
        columns = columns.map(c => {
            const current = R.view(colLenses.transforms, c) || []
            return R.set(colLenses.transforms, current.concat([addTitleTransformer]), c)
        })
            

        // Pre-sort if sorting criteria is set.
        const sortedData = sort.sorter({
            columns,
            sortingColumns,
            strategy: this.state.strategy,
            sort: orderBy
        })(data)

        // Identify selected rows. Selected rows will be modified
        // with a property added "selected: boolean" which means they will be re-rendered and
        // onRow called again on those rows only.
        const {rows, selectedRows} =
            (this.state.idAttr && selectedId) ? 
            R.pipe(
                select.none, // set selected = false
                select.rows(row => row[this.state.idAttr] === selectedId))(sortedData) :
            { rows: sortedData, selectedRows: []}

        // After sorting and selection, find selectedRowIndex
        const selectedRowIndex = (this.state.idAttr && selectedId) ?
                                 R.findIndex(R.propEq(this.state.idAttr, selectedId))(rows) :
                                -1

        // add some space for a scrollbar if one is needed ever
        const totalColumnsWidth =
            columns.reduce((sum,c) => sum += c.props.style.minWidth, 0) + 17
        if(DEBUG) console.log("totalColumnsWidth", totalColumnsWidth)
        
        const tableWidth=totalColumnsWidth
        //const tableHeight= this.props.tableHeight || 250
        
        const tableStyle = {
            width: tableWidth,
            clear: "none"
        }
        const tableHeaderStyle = {
            maxWidth: tableWidth,
            overflow: "hidden"
        }
        const tableBodyStyle = {
            maxWidth: tableWidth,
            //maxHeight: tableHeight,
            overflow: "auto"
        }

        //console.log("CrmTable.props", {selectedId, data}, selectedRowIndex)

        // select.byArrowKeys introduces a in-the-wild div.
        return(
            <div className={cx(fstyles.flexVertical, styles.wrapper, className)} data-ctag="CrmTable">
                {select.byArrowKeys({
                     rows: sortedData,
                     selectedRowIndex,
                     onSelectRow: this.onSelectRowByIndex(onSelectIndex, onSelectId, rows)
                })(
                     <Table.Provider
                             className={styles.crmTable}
                             columns={columns}
                             style={tableStyle}
                             components={{
                                 header: {
                                     cell: wrapTH
                                 },
                                 body: {
                                     cell: wrapTD
                                 }
                             }}
                         >
                         
                         <Sticky.Header
                         ref={h => { this.tableHeader = h && h.getRef(); }}
                         tableBody={this.tableBody}
                         style={tableHeaderStyle}
                         onScroll={this.doScroll}
                         />

                         <Sticky.Body
                         className={styles.crmBody}
                         onRow = {this.onRow(onSelectIndex, onSelectId, selectedRowIndex)}
                         rows={rows}
                         rowKey={this.props.rowKey}
                         ref={b => {this.tableBody = b && b.getRef(); }}
                         tableHeader={this.tableHeader}
                         onScroll={this.doScroll}
                         style={tableBodyStyle}
                         />
                     </Table.Provider>
                 )}
                  <HorizontalScrollBar
                      className={fstyles.flexNone}
                      width={tableWidth}
                      scrollWidth={totalColumnsWidth}
                      left={0}
                      top={0}
                      onScroll={this.doScroll}/>
            </div>)
    }

    onSelectRowByIndex = (byIndex, byId, rows) => (idx) => 
        this.reportBack(byIndex, byId, null, rows, idx)
    
    onRow = (byIndex, byId, selectedRowIndex) => (row, {rowIndex}) => {
        //console.log("onRow",selectedRowIndex, rowIndex)
        return ({
            className: cx(
                rowIndex % 2 ? "oddRow" : "evenRow",
                (row.selected || selectedRowIndex === rowIndex) && styles.selected),
            onClick: () => this.reportBack(byIndex, byId, row[this.state.idAttr], null, rowIndex)
        })
    }

    reportBack = (byIndex, byId, id, rows, idx) => {
        if(byIndex && idx !== null) byIndex(idx)
        // should reverse engineer index if rows, id are defined
        if(byId && !R.isNil(id)) byId(id)
        else if(!R.isNil(idx) && rows && byId) {
            const idAttr = this.state.idAttr
            const id = rows[idx][idAttr]
            if(!R.isNil(id)) byId(id)
        }
    }

}

export default CrmTable

/** Take the property value for a cell and add a title property. */
export const addTitleTransformer = (value, ctx) => ({ title: value })

/** Column lenses. */
export const colLenses = {
    transforms: R.lensPath(["cell", "transforms"]),
    formatters: R.lensPath(["cell", "formatters"])
}


/**
 * See: https://reactabular.js.org/#/examples/header-body-aligned
 */
export class HorizontalScrollBar extends React.PureComponent {
    render() {
        let { width, scrollWidth, left, top, ...props } = { ...this.props };
        left = left || 0;
        top = top || 0;

        let scrollbarOuterStyle = {
            display: 'inline-block',
            overflow: 'auto',
            backgroundColor: 'transparent',
            position: 'relative',
            width: width,
            height: 16,
            left: {left},
            top: {top},
        };
        let scrollbarInnerStyle = {
            display: 'inline-block',
            width: scrollWidth,
            height: '100%'
        };

        return (
            <div style={ scrollbarOuterStyle } {...props} >
                <span
                    style={ scrollbarInnerStyle }
                />
            </div>
        );
    }
}

export function controlOverflow(content, title, { className }) {
    const cls = cx(styles.textOverflowContainer, className)
    return(
        <span className={cls}>
            <span className={styles.textOverflowEllipsis} title={title}>
                {content}
            </span>
        </span>
    )
}

export const wrapTD = ({children, className, title, ...rest}) => {
    //title = typeof title === "string" ? title || null
    const cls = cx(className)
    return (
        <td {...rest} className={cls} title={title}>
            <Ellipsis>
                {children}
            </Ellipsis>
        </td>
    )
}


export const wrapTH = ({children, className, title, ...rest}) => {
    //title = (typeof title === "string") ? title || null
    const cls = cx(className)
    return (
        <th {...rest} className={cls}>
            <Ellipsis>
                {children}
            </Ellipsis>
        </th>
    )
}

