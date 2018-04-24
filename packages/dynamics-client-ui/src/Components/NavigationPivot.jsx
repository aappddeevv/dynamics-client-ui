/** Navigation via Pivot from Office UI Fabric. */
import React from "react"
import { render } from "react-dom"

import {Fabric} from "office-ui-fabric-react/lib"
import { Pivot, PivotItem }
from 'office-ui-fabric-react/lib/Pivot';

/**
 * Manage state as best you can given that all changes are side-effects to dynamics.
 * There is not an easy way to detect when the tabs are changed external to
 * react. Tabs hidden at the start are always hidden. Tabs are set once in props once
 * at creation time and cannot be changed.
 */
export class DynamicsPivot extends React.Component {

    static ALL = -1
    
    constructor(props) {
        super(props)

        let alwaysHidden = props.alwaysHidden || []
        if(props.tabs && !props.alwaysHidden) {
            // tabs is a fake array
            for(let i=0; i< props.tabs.getLength(); i++) {
                const t = props.tabs.get(i)
                if(!t.getVisible()) alwaysHidden.push(i)
            }
        }
        
        this.state = {
            alwaysHidden, // indexes to hide, 0-based
            selectedIndex: props.selectedIndex ||
                           ((props.tabs && props.tabs.getLength() > 0) ? 0 : DynamicsPivot.ALL),
            tabs: props.tabs,
            // true=>collapse un-selected tabs but keep visible
            // otherwise un-selected tabs are not visible
            collapse: props.collapse,
            labelMap: props.labelMap, // use these labels instead of actual tab labels
        }
    }

    static defaultProps = {
        alwaysHidden: null,
        collapse: true,
        tabs: null,
        labelMap: {}
    }

    /** Get a label for a tab. Uses labelMap. */
    getLabel = (t) => {
        const lab = t.getLabel()
        const calc = this.state.labelMap[lab]
        if(calc) return calc
        return lab
    }
    
    /** Hide all but selected. This has side effects not visible to react. */
    processTabs = () => {
        const selected = this.state.selectedIndex
        const haveTabs = this.state.tabs
        if(haveTabs) {
            for(let i=0; i < this.state.tabs.getLength(); i++) {
                const shouldHide = this.state.alwaysHidden.includes(i)
                const t = this.state.tabs.get(i)
                if((i !== selected || shouldHide) && selected != DynamicsPivot.ALL) {
                    // hide
                    if(this.state.collapse) t.setDisplayState("collapsed")
                    else t.setVisible(false)
                }
                else if(!shouldHide) {
                    t.setDisplayState("expanded")
                    t.setVisible(true)
                }
            }
            const focusIndex = (selected === DynamicsPivot.ALL &&
                                haveTabs && this.state.tabs.getLength()>0) ? 0 :
                               (haveTabs &&
                                selected < this.state.tabs.getLength() ? selected : -1)
            if(haveTabs && focusIndex >= 0)
                this.state.tabs.get(focusIndex).setFocus()
        }
    }

    handleClick = (pivotItem) =>
        this.setState({selectedIndex: parseInt(pivotItem.props.itemKey)})

    render() {
        const pivots = []
        for(let i=0; i<this.state.tabs.getLength(); i++) {
            const t = this.state.tabs.get(i)
            if(!this.state.alwaysHidden.includes(i))
                pivots.push({linkText: this.getLabel(t), i})
        }
        pivots.push({linkText: "All", i: DynamicsPivot.ALL}) // ALL is last
        let selectedKey = this.state.selectedIndex === DynamicsPivot.ALL ?
                          this.state.tabs.getLength() : this.state.selectedIndex
        
        this.processTabs() // kind of like a render
        return (
            <Pivot headersOnly
                   selectedKey={selectedKey}
                   onLinkClick={this.handleClick}>
                {
                    pivots.map(p =>
                        <PivotItem linkText={p.linkText} itemKey={p.i} key={p.i}/>)
                }
            </Pivot>
        )
    }
}

export function run({target, collapse, labelMap}) {
    const _xrm = window.parent.Xrm || Xrm

    // this pages parameters not the overall form
    const dataStr = Xrm.Page.context.getQueryStringParameters()["data"]
    const data = dataStr ? JSON.parse(dataStr) : {}
    
    collapse = collapse || data.collapse || true
    labelMap = labelMap || data.labelMap || {}
    
    render(
        <Fabric>
            <DynamicsPivot tabs={_xrm.Page.ui.tabs}
                           collapse={collapse}
                           labelMap={labelMap}/>
        </Fabric>,
        target)
}
