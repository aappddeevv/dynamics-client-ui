// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react

import scala.scalajs.js
import js.|
import js.annotation._

import ttg.react._
import elements._

@js.native
@JSImport("react-content-loader", JSImport.Namespace)
object ReactContentLoader extends js.Object {
  val BulletList: ReactJsComponent = js.native
  val List: ReactJsComponent       = js.native
  val Code: ReactJsComponent       = js.native
  val Instagram: ReactJsComponent  = js.native
  val Facebook: ReactJsComponent   = js.native
}

trait ReactContentLoaderOptions extends js.Object {
  var animate: js.UndefOr[Boolean] = js.undefined
  var speed: js.UndefOr[Int] = js.undefined
  var className: js.UndefOr[String] = js.undefined
  var width: js.UndefOr[Double] = js.undefined
  var height: js.UndefOr[Double] = js.undefined
  var preserveAspectRatio: js.UndefOr[String] = js.undefined
  var primaryColor: js.UndefOr[String] = js.undefined
  var secondaryColor: js.UndefOr[String] = js.undefined
  var style: js.UndefOr[js.Object | js.Dynamic] = js.undefined
  var uniquekey: js.UndefOr[String] = js.undefined
}

object ReactContentLoaderComponents {
  import ttg.react.elements.wrapJsForScala

  def BulletList(props: ReactContentLoaderOptions = null)(children: ReactNode*) =
    wrapJsForScala(ReactContentLoader.BulletList, props, children: _*)
}
