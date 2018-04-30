// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react

import scala.scalajs.js
import js.|
import js.annotation._

import ttg.react._

package object addresseditor {

  /** 
   * Render a value for display or editing.
   *
   * @param value undef
   * @param className undef
   */
  type ValueRenderer[T] = RendererContext[T] => ReactElement

  /**
   * Render a label.
   * @param className undef
   */
  type LabelRenderer = LabelRendererContext => ReactElement

  /** 
   * Extract a value from an js.Object/input value suitable for using in a ValueRenderer.
   */
  type Extractor[O, A] = Option[O] => Option[A]


  @inline def cleanId(id: String): String = id.stripSuffix("}").stripPrefix("{").trim
}

@JSImport("BuildSettings", JSImport.Namespace)
@js.native
object BuildSettings extends js.Object {
  val DEBUG: Boolean = js.native
}
