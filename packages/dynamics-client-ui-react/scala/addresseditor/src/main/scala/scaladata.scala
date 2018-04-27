// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

import scala.scalajs.js
import js.annotation._

@JSExportTopLevel("ScalaOption")
object ScalaOptionForJS {
  @JSExport
  def some[A](a: js.UndefOr[A]): Option[A] =
    a.toOption.filter(_ != null)

  @JSExport
  def none: None.type = None

  @JSExport
  def getOrElse[A](opt: Option[A], orElse: A): A =
    opt.getOrElse(orElse)

  @JSExport
  def fold[A, B](opt: Option[A], ifEmpty: js.Function0[B], f: js.Function1[A, B]): B =
    opt.fold(ifEmpty())(a => f(a))
}
