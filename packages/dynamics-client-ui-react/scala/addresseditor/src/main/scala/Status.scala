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
trait StatusClassNames extends js.Object {
  var root: String = js.native
  var label: String = js.native
}

trait StatusStyles extends js.Object {
  var root: js.UndefOr[IStyle] = js.undefined
  var label: js.UndefOr[IStyle] = js.undefined  
}

trait StatusProps extends js.Object {
  var styles: js.UndefOr[StatusStyles] = js.undefined
  var className: js.UndefOr[String] = js.undefined
}

/** Show the status of an attribute e.g. Ok or Erroras a small adornment. */
@JSExportTopLevel("Status")
object Status {

  val c = statelessComponent("Status")
  import c.ops._

  def make(props: js.UndefOr[StatusProps] = js.undefined) = c.copy(new methods{
    val styles = getStyles(props.map(_.styles).getOrElse(js.undefined))
    val cn = getClassNames(props.map(_.className).getOrElse(js.undefined), styles)
    val render = self => {
      div(new DivProps {
        className = cn.root
      })(
        label(new LabelProps {
          className = cn.label
        })()
      )
    }
  })

  @JSExport("make")
  val jsComponent = c.wrapScalaForJs { (jsProps: js.UndefOr[StatusProps]) =>
    make(jsProps)
  }

  def _getStyles(customStyles: js.UndefOr[StatusStyles]): StatusStyles = {
    val styles = new StatusStyles {
      root = new IRawStyle {
        border = 0
        padding = 0
        margin = 0
        marginRight = "0.25em"
        marginLeft = "0.25em"
        display = "inline-flex"
        justifyContent= "center"
        alignItems = "center"
      }
      label= new IRawStyle {
        height = "1rem"
        width = "1rem"
        textAlign = "center"
      }
    }
    concatStyleSets[StatusStyles](styles, customStyles)
  }

  @JSExport
  def getStyles = memoizeFunction(js.Any.fromFunction1(_getStyles))

  private def _getClassNames(
    className: js.UndefOr[String] = js.undefined,
    customStyles: js.UndefOr[StatusStyles] = js.undefined): StatusClassNames = {
    mergeStyleSets[StatusClassNames](
      styleset(
        "root" -> stylearray(
          "ttg-Status",
          className,
          customStyles.flatMap(_.root)
        ),
        "label" -> stylearray(
          "ttg-StatusLabel",
          customStyles.flatMap(_.label)
        )
    ))
  }

  @JSExport
  def getClassNames = memoizeFunction(js.Any.fromFunction2(_getClassNames))
}
