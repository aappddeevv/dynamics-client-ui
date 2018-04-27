// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js

/** 
 * Entity metadata of the entity being edited.
 */
trait EditorEntityMetadata extends js.Object {
  /** 
   * Core target entity definition, although you could be editing more than one
   * entity
   */
  val entity: EntityDefinition
  /** All attributes */
  val attributes: js.Array[AttributeMetadata]
  /** By metadata id */
  val attributesById: js.Dictionary[AttributeMetadata]
  /** By metadata attributeName */
  val attributesByName: js.Dictionary[AttributeMetadata]  
}

trait AttributeSpecification extends js.Object {
  /** logical name on entity */
  val name: String
  /** order, temporary until we get some more layout control */
  val position: Int

  // rendered control type information to override defaults?
  // ...
}

/**
 * Top down data to display on a form, including layout information. 
 * Ok, no layout information yet...can we translate that found in a dynmics form?
 */
@js.native
trait EditorSpecification extends js.Object {
  /** Attributes to show in the form. */
  val attributes: js.Array[AttributeSpecification] = js.native
  /** Metadata about the entity and attributes being edited. */
  val metadata: EditorEntityMetadata = js.native
  /** Perform a lookup in some UI specific way. */
  val performSearch: js.Function2[js.Array[String], js.UndefOr[Boolean], js.Promise[js.UndefOr[js.Array[LookupValue]]]] = js.native
}

@js.native
trait LookupValue extends js.Object {
  var entityName: String = js.native
  var id: String = js.native
  var name: String = js.native
}
