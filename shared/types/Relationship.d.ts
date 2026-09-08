/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type FactAId = string;
export type FactBId = string;
export type Type = "CORROBORATED" | "CONTRADICTED" | "RECONCILED" | "UNCERTAIN";
export type Explanation = string;
/**
 * @minItems 1
 */
export type Dimensions = [DimensionComparison, ...DimensionComparison[]];
export type Dimension = string;
export type JsonValue = unknown;
export type Outcome = "aligned" | "different" | "unknown" | "not_applicable";
export type Explanation1 = string;
export type EvidenceIds = string[];
export type Confidence = number | null;
export type ConfidenceSource = "model" | "rule";
export type UnresolvedContext = string[];
export type SupportingEvidenceIds = string[];
export type ReasoningRunId = string;
export type ReasoningVersion = string;
export type ModelVersion = string | null;
export type PromptVersion = string | null;
export type InputHash = string;

export interface Relationship {
  id: Id;
  fact_a_id: FactAId;
  fact_b_id: FactBId;
  type: Type;
  explanation: Explanation;
  dimensions: Dimensions;
  confidence: Confidence;
  confidence_source: ConfidenceSource;
  unresolved_context: UnresolvedContext;
  supporting_evidence_ids: SupportingEvidenceIds;
  reasoning_run_id: ReasoningRunId;
  reasoning_version: ReasoningVersion;
  model_version: ModelVersion;
  prompt_version: PromptVersion;
  input_hash: InputHash;
}
export interface DimensionComparison {
  dimension: Dimension;
  fact_a: JsonValue;
  fact_b: JsonValue;
  outcome: Outcome;
  explanation: Explanation1;
  evidence_ids: EvidenceIds;
}
