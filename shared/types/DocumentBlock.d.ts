/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type DocumentId = string;
export type RunId = string;
export type LocalRef = string;
export type Label = string;
export type OriginalText = string;
export type JsonValue = unknown;
export type ParentBlockId = string | null;
export type Section = string[];
export type ReadingOrder = number;
/**
 * @minItems 1
 */
export type Provenance = [Provenance1, ...Provenance1[]];
export type PhysicalPage = number;
export type PrintedLabels = string[];
export type OriginalPage = number | null;
export type Left = number;
export type Top = number;
export type Right = number;
export type Bottom = number;
export type CoordinateOrigin = "TOPLEFT" | "BOTTOMLEFT";
export type PageWidth = number;
export type PageHeight = number;

export interface DocumentBlock {
  id: Id;
  document_id: DocumentId;
  run_id: RunId;
  local_ref: LocalRef;
  label: Label;
  original_text: OriginalText;
  structure: Structure;
  parent_block_id: ParentBlockId;
  section: Section;
  reading_order: ReadingOrder;
  provenance: Provenance;
}
export interface Structure {
  [k: string]: JsonValue;
}
export interface Provenance1 {
  physical_page: PhysicalPage;
  printed_labels: PrintedLabels;
  original_page: OriginalPage;
  bbox: BoundingBox | null;
}
export interface BoundingBox {
  left: Left;
  top: Top;
  right: Right;
  bottom: Bottom;
  coordinate_origin: CoordinateOrigin;
  page_width: PageWidth;
  page_height: PageHeight;
}
