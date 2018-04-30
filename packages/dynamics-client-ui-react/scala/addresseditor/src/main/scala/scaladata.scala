// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

import scala.scalajs.js
import js.annotation._
import js.JSConverters._

/** Convert a value, possible null or undefined, to a scala Option. */
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

/** Create a scala function given a js function. */
@JSExportTopLevel("ScalaFunc")
object ScalaFuncForJS {
  @JSExport def func0[A](f: js.Function0[A]) = js.Any.toFunction0(f)
  @JSExport def func1[P1, A](f: js.Function1[P1, A]) = js.Any.toFunction1(f)
  @JSExport def func2[P1,P2,A](f: js.Function2[P1, P2, A]) = js.Any.toFunction2(f)
}

/** Create a scala Seq from an array. */
@JSExportTopLevel("ScalaSeq")
object ScalaSeqForJS {
  @JSExport def seq[A](a: js.Array[A]) = a.toSeq
}
