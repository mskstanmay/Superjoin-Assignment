/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type DocumentId = string;
export type RunId = string;
export type CandidateKey = string;
export type AssertionText = string;
export type SubjectOriginal = string;
export type SubjectEntityId = string | null;
export type PredicateOriginal = string;
export type PredicateId = string | null;
export type Value = NumberValue | RangeValue | SemanticValue | BooleanValue | DateValue;
export type OriginalText = string;
export type Unit = string | null;
export type Currency = string | null;
export type Scale = string | null;
export type Approximate = boolean;
export type Precision = number | null;
export type NormalizationStatus = "normalized" | "unchanged" | "ambiguous" | "unsupported";
export type RuleVersion = string;
export type Kind = "number";
export type Normalized = string | null;
export type Comparator = "eq" | "gt" | "gte" | "lt" | "lte";
export type OriginalText1 = string;
export type Unit1 = string | null;
export type Currency1 = string | null;
export type Scale1 = string | null;
export type Approximate1 = boolean;
export type Precision1 = number | null;
export type NormalizationStatus1 = "normalized" | "unchanged" | "ambiguous" | "unsupported";
export type RuleVersion1 = string;
export type Kind1 = "range";
export type Lower = string | null;
export type Upper = string | null;
export type LowerInclusive = boolean;
export type UpperInclusive = boolean;
export type OriginalText2 = string;
export type Unit2 = string | null;
export type Currency2 = string | null;
export type Scale2 = string | null;
export type Approximate2 = boolean;
export type Precision2 = number | null;
export type NormalizationStatus2 = "normalized" | "unchanged" | "ambiguous" | "unsupported";
export type RuleVersion2 = string;
export type Kind2 = "text" | "entity" | "other";
export type Normalized1 = string | null;
export type JsonValue = unknown;
export type OriginalText3 = string;
export type Unit3 = string | null;
export type Currency3 = string | null;
export type Scale3 = string | null;
export type Approximate3 = boolean;
export type Precision3 = number | null;
export type NormalizationStatus3 = "normalized" | "unchanged" | "ambiguous" | "unsupported";
export type RuleVersion3 = string;
export type Kind3 = "boolean";
export type Normalized2 = boolean | null;
export type OriginalText4 = string;
export type Unit4 = string | null;
export type Currency4 = string | null;
export type Scale4 = string | null;
export type Approximate4 = boolean;
export type Precision4 = number | null;
export type NormalizationStatus4 = "normalized" | "unchanged" | "ambiguous" | "unsupported";
export type RuleVersion4 = string;
export type Kind4 = "date";
export type Normalized3 = string | null;
export type OriginalLabel = string | null;
export type Kind5 = "instant" | "interval" | "fiscal_year" | "quarter" | "half_year" | "unspecified";
export type Start = string | null;
export type End = string | null;
export type CalendarBasis = string | null;
export type YearLabelConvention = string | null;
export type ResolutionStatus = "resolved" | "ambiguous" | "unspecified";
export type PublicationDate = string | null;
export type AsOfDate = string | null;
export type EffectiveDate = string | null;
export type EvidenceIds = string[];
export type Polarity = "positive" | "negative" | "unknown";
export type Modality = "asserted" | "historical" | "estimate" | "forecast" | "target" | "conditional" | "unknown";
export type Confidence = number | null;
export type Uncertainty = string[];
export type QualityState = "accepted" | "review_needed" | "quarantined";
/**
 * @minItems 1
 */
export type EvidenceIds1 = [string, ...string[]];

export interface Fact {
  id: Id;
  document_id: DocumentId;
  run_id: RunId;
  candidate_key: CandidateKey;
  assertion_text: AssertionText;
  subject_original: SubjectOriginal;
  subject_entity_id: SubjectEntityId;
  predicate_original: PredicateOriginal;
  predicate_id: PredicateId;
  value: Value;
  time: TimeContext;
  qualifiers: Qualifiers;
  polarity: Polarity;
  modality: Modality;
  confidence: Confidence;
  uncertainty: Uncertainty;
  quality_state: QualityState;
  evidence_ids: EvidenceIds1;
}
export interface NumberValue {
  original_text: OriginalText;
  unit: Unit;
  currency: Currency;
  scale: Scale;
  approximate: Approximate;
  precision: Precision;
  normalization_status: NormalizationStatus;
  rule_version: RuleVersion;
  kind: Kind;
  normalized: Normalized;
  comparator: Comparator;
}
export interface RangeValue {
  original_text: OriginalText1;
  unit: Unit1;
  currency: Currency1;
  scale: Scale1;
  approximate: Approximate1;
  precision: Precision1;
  normalization_status: NormalizationStatus1;
  rule_version: RuleVersion1;
  kind: Kind1;
  lower: Lower;
  upper: Upper;
  lower_inclusive: LowerInclusive;
  upper_inclusive: UpperInclusive;
}
export interface SemanticValue {
  original_text: OriginalText2;
  unit: Unit2;
  currency: Currency2;
  scale: Scale2;
  approximate: Approximate2;
  precision: Precision2;
  normalization_status: NormalizationStatus2;
  rule_version: RuleVersion2;
  kind: Kind2;
  normalized: Normalized1;
  attributes: Attributes;
}
export interface Attributes {
  [k: string]: JsonValue;
}
export interface BooleanValue {
  original_text: OriginalText3;
  unit: Unit3;
  currency: Currency3;
  scale: Scale3;
  approximate: Approximate3;
  precision: Precision3;
  normalization_status: NormalizationStatus3;
  rule_version: RuleVersion3;
  kind: Kind3;
  normalized: Normalized2;
}
export interface DateValue {
  original_text: OriginalText4;
  unit: Unit4;
  currency: Currency4;
  scale: Scale4;
  approximate: Approximate4;
  precision: Precision4;
  normalization_status: NormalizationStatus4;
  rule_version: RuleVersion4;
  kind: Kind4;
  normalized: Normalized3;
}
export interface TimeContext {
  original_label: OriginalLabel;
  kind: Kind5;
  start: Start;
  end: End;
  calendar_basis: CalendarBasis;
  year_label_convention: YearLabelConvention;
  resolution_status: ResolutionStatus;
  publication_date: PublicationDate;
  as_of_date: AsOfDate;
  effective_date: EffectiveDate;
}
export interface Qualifiers {
  [k: string]: Qualifier;
}
export interface Qualifier {
  value: JsonValue;
  evidence_ids: EvidenceIds;
}
