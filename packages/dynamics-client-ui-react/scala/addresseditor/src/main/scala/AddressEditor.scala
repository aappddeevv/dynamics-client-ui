// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.|
import js.annotation._

import ttg.react.{elements,fabric,implicits,vdom,_}
import elements._
import fabric.{components,styling,_}
import components._
import styling.{Styling,_}
import Styling._
import fabric.Utilities._
import vdom.{tags,_}
import tags._
import implicits._

object AddressEditor {

  type T = CustomerAddress

  sealed trait Action

  case class State (
    val selected: Option[T] = None,
    val buffer: Option[T] = None,
    val changed: Seq[String] = Nil,
    // keep in native javascript array format
    val items: js.Array[T] = js.Array(),
  )

  val c = reducerComponent[State, Action]("AddressEditor")
  import c.ops._

  def apply() =
    c.copy( new methods {
      val initialState = self => State()
      val reducer = (action, state, gen) => {
        gen.skip
      }
      val render = self => {
        div("address editor")
      }
    })
}
