/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type DocumentId = string;
export type Status =
  "uploaded" | "queued" | "processing" | "retry_wait" | "completed" | "partially_completed" | "failed";
export type Stage = ("document_understanding" | "extraction" | "normalization" | "matching" | "reasoning") | null;
export type PagesProcessed = number;
export type PagesTotal = number | null;
export type ChunksProcessed = number;
export type FactsAccepted = number;
export type FactsRejected = number;
export type ComparisonsCompleted = number;
export type ComparisonsFailed = number;
export type Attempt = number;
export type HeartbeatAt = string | null;
export type NextAttemptAt = string | null;
export type LeaseToken = string | null;
export type Pipeline = string;
export type SchemaVersion = "1.0";
export type Conversion = string;
export type Chunking = string;
export type Normalization = string;
export type Model = string | null;
export type Prompt = string | null;
export type JsonValue = unknown;
export type StartedAt = string | null;
export type EndedAt = string | null;

export interface ProcessingJob {
  id: Id;
  document_id: DocumentId;
  processing: ProcessingStatus;
  attempt: Attempt;
  heartbeat_at: HeartbeatAt;
  next_attempt_at: NextAttemptAt;
  lease_token: LeaseToken;
  versions: Versions;
  checkpoint: Checkpoint;
  started_at: StartedAt;
  ended_at: EndedAt;
}
export interface ProcessingStatus {
  status: Status;
  stage: Stage;
  counts: Counts;
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
export interface Versions {
  pipeline: Pipeline;
  schema_version: SchemaVersion;
  conversion: Conversion;
  chunking: Chunking;
  normalization: Normalization;
  model: Model;
  prompt: Prompt;
}
export interface Checkpoint {
  [k: string]: JsonValue;
}
