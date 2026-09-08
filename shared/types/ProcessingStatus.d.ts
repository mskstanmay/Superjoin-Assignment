/* Generated from shared/contracts; do not edit. */

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
