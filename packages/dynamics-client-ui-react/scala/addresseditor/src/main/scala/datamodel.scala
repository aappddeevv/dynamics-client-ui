// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js.|
import js.annotation._

trait CustomerAddress extends js.Object {
  var    customeraddressid: js.UndefOr[String] = js.undefined
  var    addressnumber: js.UndefOr[Int] = js.undefined
  var    name: js.UndefOr[String] = js.undefined
  /** Bill To, Ship To, its the OptionSet numerical value. */
  var    addresstypecode: js.UndefOr[Int] = js.undefined
  var    city: js.UndefOr[String] = js.undefined
  var    country: js.UndefOr[String] = js.undefined
  var    county: js.UndefOr[String] = js.undefined
  var    line1: js.UndefOr[String] = js.undefined
  var    line2: js.UndefOr[String] = js.undefined
  var    line3: js.UndefOr[String] = js.undefined
  var    postalcode: js.UndefOr[String] = js.undefined
  var    postofficebox: js.UndefOr[String] = js.undefined
  var    primarycontactname: js.UndefOr[String] = js.undefined
  var    shippingmethodcode: js.UndefOr[Int] = js.undefined
  var    stateorprovince: js.UndefOr[String] = js.undefined
  var    telephone1: js.UndefOr[String] = js.undefined
  var    telephone2: js.UndefOr[String] = js.undefined
  var    telephone3: js.UndefOr[String] = js.undefined
  var    latitude: js.UndefOr[Int] = js.undefined
  var    longitude: js.UndefOr[Int] = js.undefined
  /** Typecode that this address is linked to. */
  var    objecttypecode: js.UndefOr[Int] = js.undefined
  /** Linked to parentid_account, parentid_contact nav property. */
  var    _parentid_value: js.UndefOr[String] = js.undefined
}

