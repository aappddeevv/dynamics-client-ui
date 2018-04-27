// Copyright (c) 2018 The Trapelo Group LLC
// This software is licensed under the MIT License (MIT).
// For more information see LICENSE or https://opensource.org/licenses/MIT

package dynamics.client.ui.react
package addresseditor

import scala.scalajs.js
import js._
import annotation._

/**
 * @see https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/localizedlabel?view=dynamics-ce-odata-9
 */
@js.native
trait LocalizedLabel extends js.Object {
  val Label: String               = js.native
  val MetadataId: String          = js.native
  val IsManaged: UndefOr[Boolean] = js.native
  val LanguageCode: Int           = js.native
}

/** 
 * Typically a Label or Description.
 * 
 * @see https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/label?view=dynamics-ce-odata-9
 */
@js.native
trait LocalizedInfo extends js.Object {
  val LocalizedLabels: UndefOr[js.Array[LocalizedLabel]] = js.native
  val UserLocalizedLabel: UndefOr[LocalizedLabel]        = js.native
}

object LocalizedHelpers {

  /** Get user localized label. If absent, use lcid, if absent, return None */
  def label(info: LocalizedInfo, lcid: Option[Int] = None): Option[String] =
    labelForUser(info) orElse lcid.flatMap(i => findByLCID(i, info)).map(_.Label)

  /** Return the label for the user localized label or None. */
  def labelForUser(info: LocalizedInfo): Option[String] =
    info.UserLocalizedLabel.map(_.Label).toOption

  /** 
   * Return the localized label (based on lcid) then the user localized label
   * then None.
   */
  def findByLCID(lcid: Int, info: LocalizedInfo): Option[LocalizedLabel] =
    info.LocalizedLabels.toOption.flatMap(_.find(_.LanguageCode == lcid)) orElse
      info.UserLocalizedLabel.toOption
}

@js.native
trait MetadataBase extends js.Object {
  var MetadataId: String = js.native
}

@js.native
trait EntityDefinition extends MetadataBase {
  var LogicalName: String
  var SchemaName: String
  var PrimaryIdAttribute: String
  var PrimaryNameAttribute: String  
  var LogicalCollectionName: String
  // ...and more...
}

@js.native
trait  BooleanManagedProperty extends js.Object {
  var Value: Boolean = js.native
  var CanBeChanged: Boolean = js.native
  var ManagedPropertyLogicalName: String = js.native
}

object AttributeRequiredLevel {
  val None = 0
  val SystemRequired = 1
  val ApplicationRequired = 2
  val Recommended = 3
}

@js.native
trait  AttributeRequiredLevelManagedProperty extends js.Object {
  var Value: Int = js.native
  var CanBeCahnged: Boolean = js.native
  var ManagedPropertyLogicalName: String =js.native
}

@js.native
trait AttributeMetadata extends MetadataBase {
  var  LogicalName: String = js.native
  var    AttributeOf: String | Null = js.native
  /** A string like Decimal or Picklist or Lookup. */
  var    AttributeType: String = js.native
  /** Typicalyl appends the suffix "Type" to AttributeType. */
         //var    AttributeTypeName: { Value: String }
  var    ColumnInt: Int = js.native
  var    DatabaseLength: Int | Null = js.native
  var    Description: LocalizedInfo
  var    DisplayName: LocalizedInfo
  /** Entity this attribute belongs. */
  var    EntityLogicalName: String = js.native
  /** Undocumented. */
  var    ExternalName: String | Null = js.native
  var    FormulaDefinition: String | Null = js.native
  var    HasChanged: Boolean | Null = js.native
  var    RequiredLevel: AttributeRequiredLevelManagedProperty = js.native
  var    IsAuditEnabled: BooleanManagedProperty = js.native
  var    IsCustomAttribute: Boolean = js.native
  var    IsCustomizable: BooleanManagedProperty = js.native
  var    IsDataSourceSecret: Boolean = js.native
  var    IsFilterable: Boolean = js.native
  var    IsGlobalFilterEnabled: BooleanManagedProperty = js.native
  var    IsLocalizable: Boolean = js.native
  var    IsLogical: Boolean = js.native
  var    IsManaged: Boolean = js.native
  var    IsPrimaryId: Boolean = js.native
  var    IsPrimaryName: Boolean = js.native
  var    IsRenameable: Boolean = js.native
  /** Undocumented. */
  var    IsRequiredForForm: Boolean = js.native
  /** Use this to find retrievable attributes. */
  var    IsRetrievable: Boolean = js.native
  var    IsSearchable: Boolean = js.native
  var    IsSecured: Boolean = js.native
  var    IsSortableEnabled: BooleanManagedProperty = js.native
  var    IsValidForAdvancedFind: BooleanManagedProperty = js.native
  /** True, can include in a create request. */
  var    IsValidForCreate: Boolean = js.native
  var    IsValidForForm: Boolean = js.native
  var    IsValidForGrid: Boolean = js.native
  var    IsValidForRead: Boolean = js.native
  var    IsValidForUpdate: Boolean = js.native
  var    LinkedAttributeId: String | Null = js.native
  var    MaxLength: Int
  /** Often, but not always, a semi-capitalized version of logical name. */
  var    SchemaName: String = js.native
  /** For rollup/calculated attributes only. */
  var    SourceType: Int = js.native
  var    SourceTypeMask: Int = js.native
}

@js.native
trait StringAttributeMetadata extends AttributeMetadata {
  var MaxLength: Int = js.native
}

@js.native
trait MemoAttributeMetadata extends StringAttributeMetadata {
}

@js.native
trait LookupAttributeMetadata extends AttributeMetadata {
  /** Lookup types for the lookup. Is this encoded or a just a single logical name? */
  var Targets: String = js.native
}


@js.native
trait DateTimeBehavior extends js.Object {
// The value can be UserLocal, DateOnly, or TimeZoneIndependent
  var Value: String = js.native
}

object DateTimeFormat {
  val DateOnly = 0
  val DateAndTime = 1
}

@js.native
trait DateTimeAttributeMetadata extends AttributeMetadata {
  var DateTimeBehavior:  DateTimeBehavior = js.native
  var Format: Int = js.native
  var MinSupportedValue: js.Any = js.native
  var MaxSupportedValue: js.Any = js.native
}

@js.native
trait DoubleAttributeMetadata extends AttributeMetadata {
  var MinValue:  Double = js.native
  var MaxValue:  Double = js.native
}
