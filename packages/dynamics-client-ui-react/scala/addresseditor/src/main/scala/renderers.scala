// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.annotation._
import js.JSConverters._
import js.Dynamic.{literal => jsobj}

import ttg.react.{implicits, fabric, vdom, _}
import fabric.{styling, components, _}
import components._
import styling._
import implicits._
import vdom.{tags, _}
import tags._

/** Value controls for display and editing. */
case class ValueControls[T](
  /**
   * Is display needed, maybe always show the "edit" control but
   * change highlighting?
   * 
   * @todo Think about this and avoid usage until then. 
   * Perhaps this is for read-only data?
   */
  display: ValueRenderer[T],
  /**
   * Control to show when editing that control explicitly.
   */
  edit: ValueRenderer[T]
)

/** Label + value controls. */
case class AttributeControls[T](
  label: LabelRenderer,
  value: ValueControls[T]
)

/** Exceptions to the standard ControlsFactory should be place here.. */
object CustomerAddressControlsFactory {
  // e.g. making country ar statoeorprovince a lookup not a string
}

/** JS friendly rendering context used as input to a ValueRenderer. */
trait RendererContext[T] extends js.Object {
  /**
   * Optional value to render. Controls should handle non-values of course
   * and show something e.g. "---" for text.
   */
  var value: js.UndefOr[T]
  /** Classname to apply to the control, typically the outer container. */
  var className: js.UndefOr[String]
}

/**
 * Labels may or may not care about changing their visuals but 
 * its possible with this context.
 */
trait LabelRendererContext extends js.Object {
  /** Classname for outer label container. */
  var className: js.UndefOr[String] = js.undefined
  /** Whether the specific attribtue this label is for is considered dirty. */
  var dirty: js.UndefOr[Boolean] = js.undefined
  /** Whether the specific attribtue this label is being actively edited. */
  var editing: js.UndefOr[Boolean] = js.undefined
  /** Whether this attribute is considered in error, perhaps it is holding a bad value. */
  var error: js.UndefOr[Boolean] = js.undefined
  /** Whether this attribute is considered required. */
  var required: js.UndefOr[Boolean] = js.undefined
}

/** mid is some type of id, such as a logicalname or metadataid. */
sealed trait EditingStatus { def mid: String }
/** An attribute is starting to be edited. This may not reliably be issued. */
case class Started(val mid: String) extends EditingStatus
/** A change was committed at the attribute level. Do not use this for per-keystroke changes. */
case class Changed(val mid: String, value: js.Any) extends EditingStatus
/** Changing was cancelled. UI probably needs a refresh to restore the original value. */
case class Cancelled(val mid: String) extends EditingStatus

/**
 * Args for creating a renderer that are independent of its runtime state.
 */
trait CreateRendererArgs[T <: AttributeMetadata, A <: js.Any] extends js.Object {
  val attribute: T
  /** Called during a single attribute's editing lifecycle. */
  val onStatusChange: js.Function1[EditingStatus, Unit]
}

/**
 * Factory based on the "type" of control. From the JS, the return value is
 * really only usable in scala.js. The rendered controls have various "data-*"
 * properties set based on AttributeMetadata.
 */
@JSExportTopLevel("Renderers")
object Renderers {

  def simpleLabelContext(_className: js.UndefOr[String] = js.undefined) =
    new LabelRendererContext {
     className = _className
    }

  def rendererArgs[T <: AttrbuteMetadata](_attribute: T, _onStatusChange: js.Function1[EditingStatus, Unit]) =
    new CreateRendererArgs {
      val attribute = _attribute
      val onStatusChange = _onStatusChange
    }

  /** Render a label to display the attribute's "name". */
  @JSExport
  def makeLabel(attribute: AttributeMetadata,
    labelOverride: js.UndefOr[String] = js.undefined): LabelRenderer = {
    val renderer: LabelRenderer = context =>
    AttributeLabel(new AttributeLabelProps {
      className = context.className
    })(labelOverride.getOrElse(LocalizedHelpers.label(attribute.DisplayName).getOrElse("no label")): String)
    renderer
  }

  def makeDataProps(attribute: AttributeMetadata): js.Object = {
    jsobj(
      "id" -> attribute.MetadataId,
      "data-attribute-name" -> attribute.LogicalName,
      "data-entity-name" -> attribute.EntityLogicalName
    )
  }

  val dataIsFocusable = jsobj("data-is-focusable" -> "true")

  /** 
   * Render a text attribute.
   * 
   * @todo Take into account MaxLength. 
   */
  @JSExport
  def makeString(args: CreateRendererArgs[StringAttributeMetadata]): ValueControls[String] = {
    val dataid = makeDataProps(attribute)
    val display: ValueRenderer[String] = context => {
      val props = merge[ILabelProps](
        new ILabelProps{
          className = context.className
        },
        dataid,
        dataIsFocusable)
      Label(props)(context.value.getOrElse[String](""))
    }

    val edit: ValueRenderer[String] = context => {
      val props =  merge[ITextFieldProps](
        new ITextFieldProps {
          value = context.value.getOrElse[String]("")
          className = context.className
          placeholder = "---"
          borderless = true
        },
        dataid,
        dataIsFocusable)
      TextField(props)()
    }
    ValueControls(display, edit)
  }

  /**
   * We use a textfield and a lookup button to the right and call the Xrm.openLookup() function
   * to open the lookup and handle the results.
   * 
   * @todo make internal styles using `mergeStyles`.
   */
  @JSExport
  def makeLookup(attribute: LookupAttributeMetadata,
  initiateSearch: () => js.Promise[js.UndefOr[LookupValue]]): ValueControls[js.Any] = {
    val display: ValueRenderer[js.Any] = context => {
      Label()("not implemented")
    }

    val edit: ValueRenderer[js.Any] = context => {
      div(new DivProps{
        style = new IRawStyle {
          display = "flex"
        }
      })(
        TextField(new ITextFieldProps {
          value = context.value.map(_.toString).getOrElse[String]("---")
        })(),
        IconButton(new IButtonProps {
          iconProps = new IIconProps { iconName = "Search" }
          onClick = js.defined(_ => initiateSearch())          
        })()
      )
    }
    ValueControls(display, edit)
  }


  /** 
   * Lookup control for attributes that are stored as strings in a dynamics
   * entity but whose value comes from a lookup on another, potentially large,
   * entity.
   */ 
  @JSExport
  def makeSyntheticLookup(attribute: StringAttributeMetadata,
    initiateSearch: () => js.Promise[js.UndefOr[LookupValue]]): ValueControls[String] = {
    val display: ValueRenderer[String] = context => div(null)
    val edit: ValueRenderer[String] = context => {
      div(new DivProps{
        style = new IRawStyle {
          display = "flex"
        }
      })(
        Label(new ILabelProps {
          style = new IRawStyle {
            width = 200 // this should not be needed!!!
          }
        })(
          context.value.map(_.toString).getOrElse[String]("---")
        ),
        IconButton(new IButtonProps {
          iconProps = new IIconProps { iconName = "Search" }
          onClick = js.defined(_ => initiateSearch())
        })()
      )
    }
    ValueControls(display, edit)
  }
}

/**
 * We need general purpose reader/writers into the underlying js.Object.
 */
object JSExtractors {
  /**
   * Can this be derived from StringAttributeMetadata directly for the odata case? I don't think so.
   */
  def string(attribute: StringAttributeMetadata, field: String): Extractor[js.Object, String] =
    obj => obj.flatMap(_.asDict[String].get(field).orUndefined)

  /** Extract a date from an object. */
  def date(attribute: DateTimeAttributeMetadata, field: String): Extractor[js.Object, js.Date] =
    obj => obj.flatMap(_.asDict[js.Date].get(field).orUndefined)



}
