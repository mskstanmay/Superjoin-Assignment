/* Generated from shared/contracts; do not edit. */

export type Id = string;
export type FactId = string;
export type DocumentId = string;
export type RunId = string;
export type BlockId = string;
export type Role =
  "assertion" | "value" | "subject" | "row_header" | "column_header" | "unit" | "time" | "footnote" | "qualifier";
export type Selector = SpanSelector | CellSelector | BlockSelector;
export type Kind = "span";
export type Start = number;
export type End = number;
export type Kind1 = "cell";
export type Row = number;
export type Column = number;
export type Kind2 = "block";
export type Quote = string;
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
export type ValidationStatus = "validated" | "rejected" | "pending";

export interface Evidence {
  id: Id;
  fact_id: FactId;
  document_id: DocumentId;
  run_id: RunId;
  block_id: BlockId;
  role: Role;
  selector: Selector;
  quote: Quote;
  provenance: Provenance;
  validation_status: ValidationStatus;
}
export interface SpanSelector {
  kind: Kind;
  start: Start;
  end: End;
}
export interface CellSelector {
  kind: Kind1;
  row: Row;
  column: Column;
}
export interface BlockSelector {
  kind: Kind2;
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
