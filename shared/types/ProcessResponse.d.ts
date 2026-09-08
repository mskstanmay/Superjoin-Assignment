/* Generated from shared/contracts; do not edit. */

export type ContractVersion = "1.0";
export type RequestId = string;
export type DocumentId = string;
export type RunId = string;
export type LeaseToken = string;
export type Status = "completed" | "partially_completed" | "failed";
export type Kind = "docling" | "blocks" | "chunks" | "candidates" | "diagnostics";
export type StorageKey = string;
export type Sha256 = string;
export type SizeBytes = number;
export type SchemaVersion = string;
export type Artifacts = Artifact[];
export type PagesProcessed = number;
export type PagesTotal = number | null;
export type ChunksProcessed = number;
export type FactsAccepted = number;
export type FactsRejected = number;
export type ComparisonsCompleted = number;
export type ComparisonsFailed = number;
export type Id = string;
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

export interface ProcessResponse {
  contract_version: ContractVersion;
  request_id: RequestId;
  document_id: DocumentId;
  run_id: RunId;
  lease_token: LeaseToken;
  status: Status;
  artifacts: Artifacts;
  counts: Counts;
  issues: Issues;
}
export interface Artifact {
  kind: Kind;
  storage_key: StorageKey;
  sha256: Sha256;
  size_bytes: SizeBytes;
  schema_version: SchemaVersion;
}
export interface Counts {
  pages_processed: PagesProcessed;
  pages_total: PagesTotal;
  chunks_processed: ChunksProcessed;
  facts_accepted: FactsAccepted;
  facts_rejected: FactsRejected;
  comparisons_completed: ComparisonsCompleted;
  comparisons_failed: ComparisonsFailed;
}
export interface ProcessingIssue {
  id: Id;
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
