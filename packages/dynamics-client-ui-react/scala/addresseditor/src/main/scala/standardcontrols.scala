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

trait Attributes {
  val nameA: StringAttributeMetadata
  val line1A: StringAttributeMetadata
  val line2A: StringAttributeMetadata
  val line3A: StringAttributeMetadata
  val telephone1A: StringAttributeMetadata
  val telephone2A: StringAttributeMetadata
  val telephone3A: StringAttributeMetadata
  val cityA: StringAttributeMetadata
  val stateorprovinceA: StringAttributeMetadata
  val countryA: StringAttributeMetadata
  val postofficeboxA: StringAttributeMetadata
  val postalcodeA: StringAttributeMetadata
}

class StandardAttributes(val specification: EditorSpecification) extends Attributes {
  val nameA = specification.metadata.attributesByName("name").asInstanceOf[StringAttributeMetadata]
  val line1A = specification.metadata.attributesByName("line1").asInstanceOf[StringAttributeMetadata]
  val line2A = specification.metadata.attributesByName("line2").asInstanceOf[StringAttributeMetadata]
  val line3A = specification.metadata.attributesByName("line2").asInstanceOf[StringAttributeMetadata]
  val telephone1A = specification.metadata.attributesByName("telephone1").asInstanceOf[StringAttributeMetadata]
  val telephone2A = specification.metadata.attributesByName("telephone2").asInstanceOf[StringAttributeMetadata]
  val telephone3A = specification.metadata.attributesByName("telephone3").asInstanceOf[StringAttributeMetadata]
  val cityA = specification.metadata.attributesByName("city").asInstanceOf[StringAttributeMetadata]
  val stateorprovinceA = specification.metadata.attributesByName("stateorprovince").asInstanceOf[StringAttributeMetadata]
  val countryA = specification.metadata.attributesByName("country").asInstanceOf[StringAttributeMetadata]
  val postofficeboxA = specification.metadata.attributesByName("postofficebox").asInstanceOf[StringAttributeMetadata]
  val postalcodeA = specification.metadata.attributesByName("postalcode").asInstanceOf[StringAttributeMetadata]    
}

class StandardControls(
  specification: EditorSpecification,
  valueopt: Option[CustomerAddress],
  onChange: EditingStatus => Unit,
  initiateSearch: String => Future[Option[LookupValue]],
  make: ReactNode => ReactNode) {

  val attrs = new StandardAttributes(specification)
  import attrs._

  val nameControl = Attribute[String](nameA,
    JSExtractors.string(nameA)(valueopt),
    AttributeControls[String](makeLabel(nameA),
      makeString(rendererArgs(nameA, onChange))), onChange)

  val line1Control = Attribute[String](line1A,
    JSExtractors.string(line1A)(valueopt),
    AttributeControls(makeLabel(line1A),
      makeString(rendererArgs(line1A, onChange))), onChange)

  val line2Control = Attribute[String](line2A,
    JSExtractors.string(line2A)(valueopt),
    AttributeControls(makeLabel(line2A),
      makeString(rendererArgs(line2A, onChange))), onChange)

  val line3Control = Attribute[String](line3A,
    JSExtractors.string(line3A)(valueopt),
    AttributeControls(makeLabel(line3A),
      makeString(rendererArgs(line3A, onChange))), onChange)

  val cityControl = Attribute[String](cityA,
    JSExtractors.string(cityA)(valueopt),
    AttributeControls(makeLabel(cityA),
      makeString(rendererArgs(cityA, onChange))), onChange)

  val stateControl = Attribute[String](stateorprovinceA,
    JSExtractors.string(stateorprovinceA)(valueopt),
    AttributeControls(makeLabel(stateorprovinceA),
      makeString(rendererArgs(stateorprovinceA, onChange))), onChange)

  val countryControl = Attribute[String](countryA,
    JSExtractors.string(countryA)(valueopt),
    AttributeControls(makeLabel(countryA),
      makeString(rendererArgs(countryA, onChange))), onChange)

  val telephone1Control = Attribute[String](telephone1A,
    JSExtractors.string(telephone1A)(valueopt),
    AttributeControls(makeLabel(telephone1A),
      makeString(rendererArgs(telephone1A, onChange))), onChange)

  val telephone2Control = Attribute[String](telephone2A,
    JSExtractors.string(telephone2A)(valueopt),
    AttributeControls(makeLabel(telephone2A),
      makeString(rendererArgs(telephone2A, onChange))), onChange)

  val telephone3Control = Attribute[String](telephone3A,
    JSExtractors.string(telephone3A)(valueopt),
    AttributeControls(makeLabel(telephone3A),
      makeString(rendererArgs(telephone3A, onChange))), onChange)

  val postofficeboxControl = Attribute[String](postofficeboxA,
    JSExtractors.string(postofficeboxA)(valueopt),
    AttributeControls(makeLabel(postofficeboxA),
      makeString(rendererArgs(postofficeboxA, onChange))), onChange)

  val postalcodeControl = Attribute[String](postalcodeA,
    JSExtractors.string(postalcodeA)(valueopt),
    AttributeControls(makeLabel(postalcodeA),
      makeString(rendererArgs(postalcodeA, onChange))), onChange)    
}

class StandardDetailContent(
  val valueopt: Option[CustomerAddress],
  val specification: EditorSpecification,
  val onChange: EditingStatus => Unit,
  val initiateSearch: String => Future[Option[LookupValue]],
  val make: ReactNode => ReactNode
) extends StandardControls(specification, valueopt, onChange, initiateSearch, make) {
  val content = Fragment.make()(
    make(nameControl),
    make(line1Control),
    make(line2Control),
    make(line3Control),
    make(postofficeboxControl),
    make(postalcodeControl),
    make(cityControl),
    make(stateControl),
    make(countryControl),
    make(telephone1Control),
    make(telephone2Control),
    make(telephone3Control),
  )
}
