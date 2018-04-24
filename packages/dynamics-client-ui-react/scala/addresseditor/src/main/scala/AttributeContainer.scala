// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.annotation._
import js.JSConverters._

import ttg.react._
import elements._
import ttg.react.vdom.tags._
import ttg.react.fabric
import fabric._
import fabric.components._
import fabric.styling._ // some types
import fabric.styling.Styling._
import fabric.Utilities._

import ttg.react.implicits._

@js.native
trait AttributeContainerClassNames extends js.Object {
  var root: String = js.native
  var label: String = js.native
}

trait AttributeContainerStyles extends js.Object {
  var root: js.UndefOr[IStyle] = js.undefined
  var label: js.UndefOr[IStyle] = js.undefined  
}

trait AttributeContainerProps extends js.Object {
  var styles: js.UndefOr[AttributeContainerStyles] = js.undefined
  var className: js.UndefOr[String] = js.undefined
}

/** The outer container for showing an attribute. */
object AttributeContainer {

  val c = statelessComponent("AttributeContainer")
  import c.ops._

  def make(props: js.UndefOr[AttributeContainerProps] = js.undefined)(children: ReactNode*) =
    c.copy(new methods {
      val styles = getStyles(props.map(_.styles).getOrElse(js.undefined))
      val cn = getClassNames(props.map(_.className).getOrElse(js.undefined), styles)
      val render = self => {
        div(new DivProps {
          className = cn.root
        })(
          children
        )
      }
    })

  val jsComponent = c.wrapScalaForJs { (jsProps: js.UndefOr[AttributeContainerProps]) =>
    make(jsProps)(extractChildren(jsProps):_*)
  }

  def _getStyles(customStyles: js.UndefOr[AttributeContainerStyles]): AttributeContainerStyles = {
    val styles = new AttributeContainerStyles {
      root = new IRawStyle {
        border = 0
        margin = 0
        padding = 0
        outline = "none"
        display = "flex" // horizontal
        borderBottom = "1px solid rgb(216,216,216)"
        alignItems = "baseline"
        whiteSpace = "nowrap"
        minHeight = 49
        paddingBottom = "0.25em"
        paddingTop = "0.25em"
        overflow = "hidden"
        width = "100%"
      }
    }
    concatStyleSets[AttributeContainerStyles](styles, customStyles)
  }

  def getStyles = memoizeFunction(js.Any.fromFunction1(_getStyles))

  private def _getClassNames(
    className: js.UndefOr[String] = js.undefined,
    customStyles: js.UndefOr[AttributeContainerStyles] = js.undefined): AttributeContainerClassNames = {
    mergeStyleSets[AttributeContainerClassNames](
      styleset(
        "root" -> stylearray(
          "ttg-AttributeContainer",
          className,
          customStyles.flatMap(_.root)
        ),
    ))
  }

  def getClassNames = memoizeFunction(js.Any.fromFunction2(_getClassNames))
}
