// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react

import scala.scalajs.js
import js.|

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
  type Extractor[O, A] = js.UndefOr[O] => js.UndefOr[A]
}
