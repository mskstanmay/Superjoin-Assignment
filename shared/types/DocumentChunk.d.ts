/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type RunId = string;
export type ChunkIndex = number;
/**
 * @minItems 1
 */
export type BlockIds = [string, ...string[]];
export type ContextualizedText = string;
export type TokenCount = number;
export type ChunkPolicyVersion = string;

export interface DocumentChunk {
  id: Id;
  run_id: RunId;
  chunk_index: ChunkIndex;
  block_ids: BlockIds;
  contextualized_text: ContextualizedText;
  token_count: TokenCount;
  chunk_policy_version: ChunkPolicyVersion;
}
