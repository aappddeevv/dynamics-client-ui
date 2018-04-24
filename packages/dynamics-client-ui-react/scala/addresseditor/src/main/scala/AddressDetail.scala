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

import ttg.react._
import elements._
import ttg.react.implicits._
import ttg.react.vdom.tags._
import ttg.react.fabric
import fabric._
import fabric.components._
import fabric.styling._ // some types
import fabric.styling.Styling._
import fabric.Utilities._

trait AddressDetailProps extends js.Object {
  var className: js.UndefOr[String] = js.undefined
  var entity: CustomerAddress|Null
  var setDirty: js.Function1[Boolean, Unit]
  var setEditing: js.Function1[Boolean, Unit]
  var specification: EditorSpecification
  // this needs to move out of here since controls are always the same once
  // we have the metadata.
  //var controlsByName
}

/**
 * Show attributes in a for like way. 
 */
@JSExportTopLevel("AddressDetail")
object AddressDetail {

  val c = statelessComponent("AddressDetail")
  import c.ops._

  def setEditing(aname: String, flag: Boolean): Unit = {
    println(s"setEditing $aname, $flag")
  }

  def setDirty(aname: String, flag: Boolean): Unit = {
    println("setDirty $aname, $flag")
  }

  def make(props: AddressDetailProps)(children: ReactNode*) = c.copy(new methods{
    val render = self => {

      js.Dynamic.global.console.log("specification", props.specification)
      val nameA = props.specification.metadata.attributesByName("name").asInstanceOf[StringAttributeMetadata]
      val line1A = props.specification.metadata.attributesByName("line1").asInstanceOf[StringAttributeMetadata]
      val line2A = props.specification.metadata.attributesByName("line2").asInstanceOf[StringAttributeMetadata]
      val telephone1A = props.specification.metadata.attributesByName("telephone1").asInstanceOf[StringAttributeMetadata]
      val telephone2A = props.specification.metadata.attributesByName("telephone2").asInstanceOf[StringAttributeMetadata]
      val telephone3A = props.specification.metadata.attributesByName("telephone3").asInstanceOf[StringAttributeMetadata]
      val cityA = props.specification.metadata.attributesByName("city").asInstanceOf[StringAttributeMetadata]
      val stateorprovinceA = props.specification.metadata.attributesByName("stateorprovince").asInstanceOf[StringAttributeMetadata]
      val countryA = props.specification.metadata.attributesByName("country").asInstanceOf[StringAttributeMetadata]

      val initiateSearch = //: js.Function2[js.Array[String], js.UndefOr[Boolean], js.Promise[LookupValue]] =
        () => props.specification.performSearch(js.Array("new_country"), js.undefined)

      val onChange: js.Function1[EditingStatus, Unit] = status => println(s"editing change $status")

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
          AttributeContainer.make()(
            Attribute[String](nameA,
              JSExtractors.string(nameA, "name")(props.entity.toUndefOr),
              AttributeControls[String](Renderers.makeLabel(nameA),Renderers.makeString(nameA)),
              setEditing _, setDirty _,
              false,
              false)),
          AttributeContainer.make()(
            Attribute[String](line1A,
              JSExtractors.string(line1A, "line1")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(line1A),
                Renderers.makeString(line1A)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](line2A,
              JSExtractors.string(line2A, "line2")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(line2A),
                Renderers.makeString(line2A)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](cityA,
              JSExtractors.string(cityA, "city")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(cityA),
                Renderers.makeString(cityA)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](stateorprovinceA,
              JSExtractors.string(stateorprovinceA, "stateorprovince")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(stateorprovinceA),
                Renderers.makeString(stateorprovinceA)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](countryA,
              JSExtractors.string(countryA, "country")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(countryA),
                Renderers.makeSyntheticLookup(countryA, initiateSearch)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](telephone1A,
              JSExtractors.string(telephone1A, "telephone1")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(telephone1A),
                Renderers.makeString(telephone1A)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](telephone2A,
              JSExtractors.string(telephone2A, "telephone2")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(telephone2A),
                Renderers.makeString(telephone2A)), setEditing _, setDirty _, false, false)),
          AttributeContainer.make()(
            Attribute[String](telephone3A,
              JSExtractors.string(telephone3A, "telephone3")(props.entity.toUndefOr),
              AttributeControls(Renderers.makeLabel(telephone3A),
                Renderers.makeString(telephone3A)), setEditing _, setDirty _, false, false)),
          children
        ))
    }
  })

  @JSExport("make")
  val jsComponent = c.wrapScalaForJs { (jsProps: AddressDetailProps) =>
    make(jsProps)(extractChildren(jsProps):_*)
  }

}
