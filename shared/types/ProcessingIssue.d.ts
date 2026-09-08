/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type RunId = string;
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

export interface ProcessingIssue {
  id: Id;
  run_id: RunId;
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
