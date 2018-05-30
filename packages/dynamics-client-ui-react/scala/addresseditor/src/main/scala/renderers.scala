// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.|
import js.annotation._
import js.JSConverters._
import js.Dynamic.{literal => jsobj}
import org.scalajs.dom

import scala.concurrent._
import scala.concurrent.ExecutionContext.Implicits.global

import cats._
import cats.data._
import cats.implicits._

import ttg.react.{implicits, fabric, vdom, _}
import fabric.{styling, components, _}
import components._
import styling._
import Styling._
import implicits._
import vdom.{tags, _}
import tags._

import metadata._

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

/**
 * When the attribute "value" needs to be rendere, it gets this context.  This
 * does not include the attribute itself since if you are creating the
 * ValueRenderer, you already know which attribute you are working with. The
 * value change notification methods, started, cancelled, and changed, use a
 * church encoding of EditingStatus but are already curried with the necessary
 * attribute id.
 */
trait RendererContext[T] {
  /**
   * Optional value to render. Controls should handle non-values of course
   * and show something e.g. "---" for text.
   */
  def value: Option[T]

  /** Classname to apply to the control, typically the outer container. */
  def className: Option[String]

  /** Editing has started. */
  def started(): Unit
  /** Editing was cancelled. */
  def cancelled(): Unit
  /** Editing resulted in a changed value. */
  def changed(value: Option[T]): Unit
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
/** An attribute is starting to be edited, individual keystrokes should not be tracked. */
case class Started(val mid: String) extends EditingStatus
/** A change was committed at the attribute level. Do not use this for per-keystroke changes. */
case class Changed(val mid: String, value: Option[scala.Any]) extends EditingStatus
/** Changing an attribute was cancelled. */
case class Cancelled(val mid: String) extends EditingStatus

/**
 * Args for creating a renderer that are independent of its runtime state.
 */
trait MakeRendererArgs[+T <: AttributeMetadata] extends js.Object {
  val attribute: T
}

/**
 * Factory based on the "type" of control. From the JS, the return value is
 * really only usable in scala.js. The rendered controls have various "data-*"
 * properties set based on AttributeMetadata. All metadata needs should have
 * been satisfied prior to using these functions since they typically run inside
 * a react render.
 * 
 * Note that TextField has a natural 12x left and right padding, so to keep all
 * the values align on the left, we have to finesse some fo the styles.
 */
@JSExportTopLevel("Renderers")
object Renderers {

  def simpleLabelContext(_className: js.UndefOr[String] = js.undefined) =
    new LabelRendererContext {
     className = _className
    }

  // Ignores _onStatusChange
  def rendererArgs[T <: AttributeMetadata](_attribute: T, _onStatusChange: js.Function1[EditingStatus, Unit]) =
    new MakeRendererArgs[T] {
      val attribute = _attribute
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

  @JSExport
  def makeDataProps(attribute: AttributeMetadata): js.Object = {
    jsobj(
      "id" -> attribute.MetadataId,
      "data-attribute-name" -> attribute.LogicalName,
      "data-entity-name" -> attribute.EntityLogicalName
    )
  }

  @JSExport
  val dataIsFocusable = jsobj("data-is-focusable" -> "true")

  /**
   * Render a text attribute.
   * 
   * @todo Take into account MaxLength. 
   */
  @JSExport
  def makeString(args: MakeRendererArgs[StringAttributeMetadata], nlines: Int = 0): ValueControls[String] = {
    //js.Dynamic.global.console.log("Renderers.makeString", args.attribute)
    val dataid = makeDataProps(args.attribute)
    val display: ValueRenderer[String] = context => {
      val props = merge[ILabelProps](
        new ILabelProps{
          className = js.defined(context.className.getOrElse(""))
        },
        dataid,
        dataIsFocusable)
      Label(props)(context.value.getOrElse[String](""))
    }

    val multilineProps =
      if(nlines > 0)
        new ITextFieldProps {
          multiline = true
          resizable = false
          rows = if(nlines>100) 10 else nlines
        }
        else new ITextFieldProps {}

    val edit: ValueRenderer[String] = context => {
      //println(s"String control (${args.attribute.LogicalName}): value ${context.value}")
      val props =  merge[ITextFieldProps](
        multilineProps,
        new ITextFieldProps {
          //defaultValue = context.value.getOrElse[String]("")
          value = context.value.getOrElse[String]("")
          className = context.className.orUndefined
          placeholder = "---"
          borderless = true
          maxLength = args.attribute.MaxLength
          onFocus = js.defined { fevent =>
            //println(s"${args.attribute.LogicalName}.onFocus")
            context.started()
          }
          onBlur = js.defined{ fevent =>
            val valueopt = Option(fevent.target.value).filterTruthy
            // following is equivalent
            //val valueopt = fevent.target.value.toTruthyUndefOr.toOption
            val changed = context.value =!= valueopt
            //println(s"${args.attribute.LogicalName}.onBlur old: ${context.value}, new: $valueopt, changed: $changed")
            if(changed) context.changed(valueopt)
            else context.cancelled()
          }
          onKeyDown = js.defined{ kevent =>
            if(kevent.keyCode == dom.ext.KeyCode.Escape) {
              context.cancelled()
            } else if(kevent.keyCode == dom.ext.KeyCode.Enter) {
              val valueopt = Option(kevent.target.value).filterTruthy
              val changed =  valueopt =!= context.value
              //println(s"${args.attribute.LogicalName}.onKeyDown old: ${context.value}, new: $valueopt, changed: $changed")
              if(changed) context.changed(valueopt)
              else context.cancelled()
            }
          }
        },
        dataid,
        dataIsFocusable)
      TextField(props)()
    }
    ValueControls(display, edit)
  }

  @JSExport
  /** Make a memo control = multi-line string editor. */
  def makeMemo(args: MakeRendererArgs[MemoAttributeMetadata], nlines: Int = 5): ValueControls[String] = {
    makeString(args, nlines)
  }

  // /**
  //  * We use a textfield and a lookup button to the right and call the Xrm.openLookup() function
  //  * to open the lookup and handle the results.
  //  *
  //  * @todo make internal styles using `mergeStyles`.
  //  */
  // @JSExport
  // def makeLookup(attribute: LookupAttributeMetadata,
  //   initiateSearch: () => js.Promise[js.UndefOr[LookupValue]]): ValueControls[js.Any] = {
  //   val dataid = makeDataProps(attribute)

  //   val display: ValueRenderer[js.Any] = context => {
  //     Label()("not implemented")
  //   }

  //   val edit: ValueRenderer[js.Any] = context => {
  //     div(new DivProps{
  //       style = new IRawStyle {
  //         display = "flex"
  //       }
  //     })(
  //       TextField(new ITextFieldProps {
  //         value = context.value.map(_.toString).getOrElse[String]("---")
  //       })(),
  //       IconButton(new IButtonProps {
  //         iconProps = new IIconProps { iconName = "Search" }
  //         onClick = js.defined(_ => initiateSearch())
  //       })()
  //     )
  //   }
  //   ValueControls(display, edit)
  // }

  /**
   * Lookup control for attributes that are stored as strings in a dynamics
   * entity but whose value comes from a lookup on another, potentially large,
   * entity. `initiateSearch` can use any information available to it to perform
   * and search and set a value. Since this function is typically called inside
   * the code that makes a detail form component, `initiateSearch` is typically
   * a curried function and the paramater here is really just a trigger.
   * 
   * An optional valueMapper can synchronously map value selected by the lookup
   * to other values that are displayed. If the key is not a string, `toString`
   * is used.
   */ 
  @JSExport
  def makeSyntheticLookup(attribute: StringAttributeMetadata, initiateSearch: => Future[Unit],
    valueMapper: js.Function1[String, String] = identity): ValueControls[String] = {
    val dataid = makeDataProps(attribute)
    val dataIsFocusable = jsobj("data-is-focusable" -> "true")

    val display: ValueRenderer[String] =
      context => div("makeSyntheticLookup.display: not implemented")

    val edit: ValueRenderer[String] = context => {
      // if map, map the value
      val valuestr = context.value.map(v => valueMapper(v.toString))
      val displayValue = valuestr.getOrElse[String]("---")

      div(merge[DivProps](
        new DivProps{
          className = context.className.orUndefined
          style = new IRawStyle {
            display = "flex"
          }
        },
        dataid,
        dataIsFocusable))(
        // show a value
        Label(new ILabelProps {
          style = new IRawStyle {
            paddingLeft = 12
            paddingRight = 12
            flex = "1 1 auto"
          }
        })(displayValue),
          // initiate search
          IconButton(new IButtonProps {
            iconProps = new IIconProps { iconName = "Search" }
            onClick = js.defined(_ => initiateSearch)
          })(),
          // clear button
          IconButton(new IButtonProps {
            iconProps = new IIconProps{ iconName = "Clear" }
            onClick = js.defined{_ =>
              context.started()
              context.changed(None)
            }})()
      )
    }
    ValueControls(display, edit)
  }

  /** Dropdown option representing "no choice" */
  val nullDropdownOption = jsobj("key" -> -1, "text" -> "---")

  /**
   * Render as a dropdown control, not a picker. Automatically adds a "null"
   * option.
   */
  @JSExport
  def makeOptionSet(attribute: PickListAttributeMetadata, _onStatusChange: js.Function1[EditingStatus, Unit]): ValueControls[Int] = {
    val dataid = makeDataProps(attribute)
    val dataIsFocusable = jsobj("data-is-focusable" -> "true")

    //js.Dynamic.global.console.log("option set attribute", attribute)
    val display: ValueRenderer[Int] = context => {
      div("option set not implemented")
    }

    // -1 is an invalid option set value
    def makeOptionsWithNullOption(): js.Array[js.Object] =
      js.Array(nullDropdownOption.asJsObj) ++ attribute.keyAndText

    val edit: ValueRenderer[Int] = context => {
      val _defaultSelectedKey = context.value.getOrElse[Int](-1)
      //println(s"className ${context.className}, ${_defaultSelectedKey}, ${context.value}")
      div(merge[DivProps](
        new DivProps {
          className = context.className.orUndefined
        },
        dataid,
        dataIsFocusable))(
        // ouch! classname applied to Dropdown is applied to the inner div!
        Dropdown(new IDropdownProps {
          placeholder = "---"
          options = makeOptionsWithNullOption()
          defaultSelectedKey = _defaultSelectedKey
          onChanged = js.defined { (option, maybeIdx ) =>
            //js.Dynamic.global.console.log("selected option", option)
            if(option.key.asInt == -1) context.changed(None)
            else context.changed(Some(option.key.asInt))
            ()
          }
        })()
      )
    }
    ValueControls(display, edit)
  }

  @JSExport
  def makeBlank(): ValueControls[Unit] = {
    val display: ValueRenderer[Unit] = context => div("blank rederer not implemented")

    val edit: ValueRenderer[Unit] = context => {
      div(new DivProps{
        className = context.className.orUndefined,
      })()
    }

    ValueControls(display, edit)
  }

}

/**
 * We need general purpose reader/writers into the underlying js.Object. Watch
 * out for underlying values being null.
 */
object JSExtractors {
  /**
   * Can this be derived from StringAttributeMetadata directly for the odata case? I don't think so.
   */
  def string(attribute: StringAttributeMetadata, field: Option[String] = None): Extractor[js.Object, String] =
    objopt => objopt.flatMap(_.asDict[String].get(field.getOrElse(attribute.LogicalName))).toNonNullOption

  def int(attribute: AttributeMetadata, field: Option[String] = None): Extractor[js.Object, Int] =
    objopt => objopt.flatMap(_.asDict[Int].get(field.getOrElse(attribute.LogicalName))).toNonNullOption

  /** Extract a date from an object, could be a date or a string depending on the reviver used. */
  def date(attribute: DateTimeAttributeMetadata, field: String): Extractor[js.Object, js.Date] =
    objopt => objopt.flatMap(_.asDict[js.Date].get(field)).toNonNullOption
}
