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
import BuildSettings.DEBUG

import Renderers.{makeLabel, makeString, rendererArgs, makeSyntheticLookup, makeMemo}

trait AddressDetailProps extends js.Object {
  val className: js.UndefOr[String]
  val entity: js.UndefOr[CustomerAddress]
  val setEditing: js.Function1[Boolean, Unit]
  val onChange: js.Function2[String, js.UndefOr[scala.Any], Unit]
  val specification: EditorSpecification
  val onRenderItem: js.UndefOr[js.Function1[ItemRenderProps, ReactNode]]
  /** 
   * When true and if entity is undefined, render a default detail
   * placeholder. Otherwise, onRenderItem (or its default) should render a
   * placeholder if it so chooses.  Default is true.
   */
  val shouldRenderNone: js.UndefOr[Boolean]
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

  val NAME = "AddressDetail"
  val c = statelessComponent(NAME)
  import c.ops._

  /** Default item renderer. Renders using `StandardDetailContent`. */
  def onRenderItem(props: ItemRenderProps): ReactNode =
    props.valueopt.fold[ReactNode]{
      NoSelection(new NoSelectionProps {
      })
    }{ _ =>
      new StandardDetailContent(
        props.valueopt,
        props.specification,
        props.onChange,
        props.performSearch,
        props.attributeControlWrapper
      ).content
    }
  
  def apply(props: AddressDetailProps) = c.copy(new methods{

    didCatch = js.defined{ (self, error, errorinfo) =>
      js.Dynamic.global.console.log("Error occurred", error, errorinfo)
    }

    val render = self => {
      def _initiateSearch(entityName: String, allowMultiple: Boolean = false) =
        props.specification.performSearch(js.Array(entityName), allowMultiple)
          .toFuture
          .recover {
            case scala.util.control.NonFatal(e) =>
              println(s"$NAME: Perform search returned error $e")
              js.Array[LookupValue]()
          }
          .map(_.headOption)

      def _onChange(status: EditingStatus): Unit = {
        println(s"editing change $status")
        status match {
          case Started(id) => props.setEditing(true)
          case Changed(id, value) => props.onChange(id, value.orUndefined.orElseNull)
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
          //height = "calc(100% - 30px)"
        })
      })(
        FocusZone(new IFocusZoneProps {
          isCircularNavigation = true
        })(
          if(_valueopt.isEmpty && props.shouldRenderNone.getOrElse(true))
            NoSelection(new NoSelectionProps { })
          else
            props.onRenderItem.fold(onRenderItem(renderProps))(_(renderProps))
        ))
    }
  })

  @JSExport("Component")
  val jsComponent = c.wrapScalaForJs { (jsProps: AddressDetailProps) =>
    apply(jsProps)
  }

}

trait NoSelectionProps extends js.Object {
  var className: js.UndefOr[String] = js.undefined
}

/**
 * Show content representing an empty selection (no value).  You can pass in a
 * className for the display. By default, it takes up 100% width and height and
 * positions itself at the top.
 */
@JSExportTopLevel("NoSelection")
object NoSelection {

  val NAME = "NoSelection"
  val c = statelessComponent(NAME)
  import c.ops._

  val defaultStyleClassName = mergeStyles(
    new IRawStyle {
      //width = "100%"
    })

  def apply(props: js.UndefOr[NoSelectionProps] = js.undefined) =
    render { self => 
      ReactContentLoaderComponents.BulletList(
        new ReactContentLoaderOptions{
          className = props.flatMap(_.className).getOrElse[String](defaultStyleClassName)          
          //animate = true
          //speed = 2
          width = 500
          //height = 50
          //height = 130
          //primaryColor = "#f3f3f3"
          //secondaryColor = "#ecebeb"
        })()
    }

  @JSExport("Component")
  val jsComponent = c.wrapScalaForJs { (jsProps: js.UndefOr[NoSelectionProps]) =>
    apply(jsProps)
  }
}
