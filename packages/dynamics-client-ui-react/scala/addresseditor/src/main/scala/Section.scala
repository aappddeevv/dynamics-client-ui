// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT
package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.annotation._

import org.scalajs.dom

import ttg.react.{implicits, vdom, elements, fabric, _}
import elements._
import implicits._
import vdom.{tags, _}
import tags._
import fabric.styling.Styling._

trait SectionProps extends AllHTMLAttributes[dom.html.Div] {
}

/**
 * Section with a border at the top and sides to match UCI. Could have a title.
 */
object Section {

  val c = statelessComponent("Section")
  import c.ops._

  def apply(props: js.UndefOr[SectionProps] = js.undefined)(children: ReactNode*) =
    render{ self =>
      val props = mergeStyles(new StyleAttr {
        background ="red"
        border = 0
        margin = 0
        borderTopColor = "0.25rem solid rgb(59, 121, 183)"
        paddingBottom = "2.25rem"
        paddingTop = "0.25rem"
        boxShadow = "rgb(255, 255, 255) 0px 0px 9px -1px"
        borderBottom = "1px solid rgb(207, 205, 204)"
        borderRight = "1px solid rgb(207, 205, 204)"
        borderLeft =  "1px solid rgb(207, 205, 204)"
        marginBottom = "1.5rem"
        paddingRight = "1.00rem"
        paddingLeft = "1.00rem"
        display = "block"
      })
      //section(props)(children:_*)
      div("not implemented")
    }

  @JSExport("Section")
  val jsComponent = c.wrapScalaForJs{ (props: SectionProps) =>
    Section.apply(props)(extractChildren(props):_*)
  }

}
