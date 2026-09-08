/* Generated from shared/contracts; do not edit. */

export type ContractVersion = "1.0";
export type RequestId = string;
export type RunId = string;
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
export type Relationships = Relationship[];
export type Id1 = string;
export type RunId1 = string;
export type Stage = "document_understanding" | "extraction" | "normalization" | "matching" | "reasoning";
export type Code = string;
export type AffectedIds = string[];
export type Severity = "info" | "warning" | "error";
export type ObservedProblem = string;
export type ActionTaken = string;
export type Retryable = boolean;
export type Resolution = string | null;
export type ArtifactKey = string | null;
export type CreatedAt = string;
export type Issues = ProcessingIssue[];

export interface ReasonResponse {
  contract_version: ContractVersion;
  request_id: RequestId;
  run_id: RunId;
  relationships: Relationships;
  issues: Issues;
}
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
export interface ProcessingIssue {
  id: Id1;
  run_id: RunId1;
  stage: Stage;
  code: Code;
  affected_ids: AffectedIds;
  severity: Severity;
  observed_problem: ObservedProblem;
  action_taken: ActionTaken;
  retryable: Retryable;
  resolution: Resolution;
  artifact_key: ArtifactKey;
  created_at: CreatedAt;
}
