/* Generated from shared/contracts; do not edit. */

export type ContractVersion = "1.0";
export type RequestId = string;
export type DocumentId = string;
export type RunId = string;
export type LeaseToken = string;
export type StorageKey = string;
export type Sha256 = string;
export type Pipeline = string;
export type SchemaVersion = "1.0";
export type Conversion = string;
export type Chunking = string;
export type Normalization = string;
export type Model = string | null;
export type Prompt = string | null;
export type MaxPages = number;
export type MaxBytes = number;
export type TimeoutSeconds = number;
export type ChunkTokenBudget = number;

export interface ProcessRequest {
  contract_version: ContractVersion;
  request_id: RequestId;
  document_id: DocumentId;
  run_id: RunId;
  lease_token: LeaseToken;
  storage_key: StorageKey;
  sha256: Sha256;
  versions: Versions;
  limits: ProcessingLimits;
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
export interface ProcessingLimits {
  max_pages: MaxPages;
  max_bytes: MaxBytes;
  timeout_seconds: TimeoutSeconds;
  chunk_token_budget: ChunkTokenBudget;
}
