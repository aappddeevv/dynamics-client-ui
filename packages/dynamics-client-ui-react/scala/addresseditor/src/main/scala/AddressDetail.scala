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
import js.|
import js.JSConverters._

import scala.concurrent._
import scala.concurrent.ExecutionContext.Implicits.global

import cats._
import cats.implicits._

import ttg.react._
import elements._
import ttg.react.implicits._
import vdom.tags._
import fabric._
import fabric.components._
import fabric.styling._ // some types
import fabric.styling.Styling._
import fabric.Utilities._

import Renderers.{makeLabel, makeString, rendererArgs, makeSyntheticLookup, makeMemo}

trait AddressDetailProps extends js.Object {
  var className: js.UndefOr[String]
  var entity: js.UndefOr[CustomerAddress]
  var setEditing: js.Function1[Boolean, Unit]
  var onChange: js.Function2[String, js.UndefOr[scala.Any], Unit]
  var specification: EditorSpecification
  var onRenderItem: js.UndefOr[js.Function1[ItemRenderProps, ReactNode]]
}

/** Children can be created using this trait as props. */
trait ItemRenderProps {
  val valueopt: Option[CustomerAddress]
  val specification: EditorSpecification
  val onChange: EditingStatus => Unit
  val performSearch: String => Future[Option[LookupValue]]
  val attributeControlWrapper: ReactNode => ReactNode
}

/**
 * Show attributes to be edited. An item renderer renders the "children". If non
 * provided, the default item renderer renders the standard CustomerAddress
 * attributes. This is presentation component that changes its props to allow
 * the childern to be created in `onRenderItem`.
 */
@JSExportTopLevel("AddressDetail")
object AddressDetail {

  val c = statelessComponent("AddressDetail")
  import c.ops._

  def onRenderItem(props: ItemRenderProps): ReactNode =
    new StandardDetailContent(
        props.valueopt,
        props.specification,
        props.onChange,
        props.performSearch,
        props.attributeControlWrapper
      ).content

  def apply(props: AddressDetailProps) = c.copy(new methods{
    val render = self => {
      def _initiateSearch(entityName: String, allowMultiple: Boolean = false) =
        props.specification.performSearch(js.Array(entityName), allowMultiple)
          .toFuture
          .recover {
            case scala.util.control.NonFatal(e) =>
              println(s"Perform search returned error $e")
              js.undefined
          }
          .map(_.toOption.flatMap(_.headOption))

      def _onChange(status: EditingStatus): Unit = {
        println(s"editing change $status")        
        status match {
          case Started(id) => props.setEditing(true)
          case Changed(id, value) => props.onChange(id, value.orUndefined)
          case Cancelled(id) => props.setEditing(false)
        }
      }

      val _valueopt = props.entity.toNonNullOption
      val renderProps = new ItemRenderProps {
        val valueopt = _valueopt
        val specification = props.specification
        val onChange = _onChange
        val performSearch = _initiateSearch(_:String)
        val attributeControlWrapper = AttributeContainer()
      }

      div(new DivProps {
        className = mergeStyles(props.className, new IRawStyle {
          display = "flex"
          flexDirection = "column"
          height = "calc(100% - 30px)"
        })
      })(
        FocusZone(new IFocusZoneProps {
          isCircularNavigation = true
        })(
          props.onRenderItem.fold(onRenderItem(renderProps))(_(renderProps))
        ))
    }
  })

  @JSExport("Component")
  val jsComponent = c.wrapScalaForJs { (jsProps: AddressDetailProps) =>
    apply(jsProps)
  }

}
