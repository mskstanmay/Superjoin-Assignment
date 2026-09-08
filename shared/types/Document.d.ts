/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type OriginalFilename = string;
export type Sha256 = string;
export type StorageKey = string;
export type ContentType = "application/pdf";
export type SizeBytes = number;
export type PageCount = number | null;
export type JsonValue = unknown;
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
export type ActiveRunId = string | null;
export type CreatedAt = string;
export type UpdatedAt = string;

export interface Document {
  id: Id;
  original_filename: OriginalFilename;
  sha256: Sha256;
  storage_key: StorageKey;
  content_type: ContentType;
  size_bytes: SizeBytes;
  page_count: PageCount;
  metadata: Metadata;
  processing: ProcessingStatus;
  active_run_id: ActiveRunId;
  created_at: CreatedAt;
  updated_at: UpdatedAt;
}
export interface Metadata {
  [k: string]: JsonValue;
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
