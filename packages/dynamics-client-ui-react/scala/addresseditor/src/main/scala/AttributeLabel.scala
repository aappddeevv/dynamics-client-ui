// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.|
import js.annotation._
import ttg.react._
import elements._
import ttg.react.implicits._
import ttg.react.vdom.tags._
import ttg.react.fabric
import fabric._
import fabric.components._
import fabric.Utilities._
import org.scalajs.dom
import ttg.react.vdom._

trait AttributeLabelProps extends  LabelHTMLAttributes[dom.html.Label] {
  //var label: String
  var isEditing: js.UndefOr[Boolean] = js.undefined
  var required: js.UndefOr[Boolean] = js.undefined // in ILabelProps
}

/**
 *  Display a label for an attribute. The basic label has no styling in itself
 * it all comes from the parent. See [[Attribute]].
 */
object AttributeLabel {
  val c = statelessComponent("AttributeLabel")
  import c.ops._

  def apply(props: AttributeLabelProps)(children: ReactNode*) =
    render{ self =>
      val divprops = getNativeProps[js.Object](props, divProperties)
      val merged =
        divprops.combine[ILabelProps](
          new ILabelProps {
            required = props.required
          })
      ttg.react.vdom.tags.label(merged.asInstanceOf[LabelProps])(
        children
      )
    }

  @JSExportTopLevel("AttrbuteLabel")
  val jsComponent = c.wrapScalaForJs{ (jsProps: AttributeLabelProps) =>
    apply(jsProps)(extractChildren(jsProps):_*)
  }
}
