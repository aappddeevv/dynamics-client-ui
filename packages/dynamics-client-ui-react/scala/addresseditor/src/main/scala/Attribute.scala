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
trait AttributeClassNames extends js.Object {
  var root: String = js.native
  var label: String = js.native
  var control: String = js.native
  var edit: String = js.native
  var display: String = js.native
}

trait AttributeStyles extends js.Object {
  var root: js.UndefOr[IStyle] = js.undefined
  var label: js.UndefOr[IStyle] = js.undefined
  var control: js.UndefOr[IStyle] = js.undefined
  var edit: js.UndefOr[IStyle] = js.undefined
  var display: js.UndefOr[IStyle] = js.undefined
  var focus: js.UndefOr[IStyle] = js.undefined
  var hover: js.UndefOr[IStyle] = js.undefined
}

/**
 * Show a label and a control, independent of the attribute's value type. 
 * Choose which attribute value controls based on the isEditing flag.
 */
@JSExportTopLevel("Attribute")
object Attribute {

  val c = statelessComponent("Attribute")
  import c.ops._

  def apply[T](
    attribute: AttributeMetadata,
    _value: js.UndefOr[T],
    controls: AttributeControls[T],
    _setEditing: (String, Boolean) => Unit,
    _setDirty: (String, Boolean) => Unit,
    /** If this attribute is editing. */
    isEditing: Boolean,
    /** If this attribute is considered dirty. */
    isDirty: js.UndefOr[Boolean] = js.undefined,
    className: js.UndefOr[String] = js.undefined,
    styles: js.UndefOr[AttributeStyles] = js.undefined,
    getClassNames: (js.UndefOr[String], js.UndefOr[AttributeStyles]) => AttributeClassNames = Attribute._getClassNames) =
    c.copy(new methods {
      val render = self => {
        val s = getStyles(styles)
        val cn = getClassNames(className, s)

        val context = new RendererContext[T] {
          var value = _value
          var className = css(cn.control, cn.edit)
          var setEditing = js.Any.fromFunction2(_setEditing)
          var setDirty = js.Any.fromFunction2(_setDirty)
        }

        div(new DivProps {
          className = cn.root
        })(
          Status.make(),
          controls.label(Renderers.simpleLabelContext(cn.label)),
          // based on editing status, use one control or the other
          //if(isEditing) controls.value.edit(context)
          //else controls.value.display(context)
          controls.value.edit(context)
        )}
    })

  def _getStyles(customStyles: js.UndefOr[AttributeStyles]): AttributeStyles = {
    val styles = new AttributeStyles {
      root = new IRawStyle {
        display = "flex !important"
        width = "100%"
        justifyContent = "inherit"
      }
      label = new IRawStyle {
        minWidth = 150
        flex = "none"
        display = "flex"
        paddingBottom = "0.25em"
        wordBreak = "breakword"
        wordWrap = "breakword"
        justifyContent = "inherit"
        whiteSpace = "normal"
        marginRight = "0.75em"
        lineHeight = "1.5em"
        overflow = "hidden"
        flexShrink = 0
        outline = "none"
      }
      control = new IRawStyle {
        flex = "1 1 auto"
        lineHeight = "2.5em"
        paddingRight = "0.5em"
        paddingLeft = "0.5em"
      }
      edit = new IRawStyle {
        fontWeight = "600"
      }
      display = new IRawStyle {
      }
      focus = new IRawStyle {
        // focus=dotted line ring
        selectors = selectorset(
          ":focus" -> new IRawStyle {
            outline = "1px dotted"
            outlineOffset = "-1px"
            fontWeight = "normal"
          }
        )
      }
      hover = new IRawStyle {
        // focus=solid line around control
        selectors = selectorset(
          ":hover" -> new IRawStyle {
            border = "1px solid rgb(102,102,102)"
            fontWeight = "normal"
          }
        )
      }
    }
    concatStyleSets[AttributeStyles](styles, customStyles)
  }

  def getStyles = memoizeFunction(js.Any.fromFunction1(_getStyles))

  private def _getClassNames(
    className: js.UndefOr[String]= js.undefined,
    customStyles: js.UndefOr[AttributeStyles] = js.undefined): AttributeClassNames = {
    mergeStyleSets[AttributeClassNames](
      styleset(
        "root" -> stylearray(
          "ttg-Attribute",
          customStyles.flatMap(_.root)
        ),
        "label" -> stylearray(
          "ttg-Label",
          customStyles.flatMap(_.label)
        ),
        "control" -> stylearray(
          "ttg-Control",
          customStyles.flatMap(_.control),
          customStyles.flatMap(_.focus),
          customStyles.flatMap(_.hover),          
        ),
        "edit" -> stylearray(
          customStyles.flatMap(_.edit)
        ),
        "display" -> stylearray(
          customStyles.flatMap(_.display)
        )
      ))
  }

  def getClassNames = memoizeFunction(js.Any.fromFunction2(_getClassNames))
}
