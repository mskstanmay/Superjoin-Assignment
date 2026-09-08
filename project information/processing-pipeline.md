# Processing pipeline

## Stage 1: Document understanding

Input is a validated PDF plus application-generated document/run IDs. Run Docling with explicit recorded conversion settings. Preserve its structured document artifact, blocks, tables, headings, lists, reading order, and provenance. Extract page-local references before creating LLM chunks. Preserve table cells and spanning headers; retain footnotes and captions with links to their parent structure.

Prefer structure-aware chunks constrained by model token budgets. A table split must repeat relevant headers, units, and notes using references to the original blocks; repeated context is not new source evidence. Avoid concatenating both halves of a spread into arbitrary token slices. Detect low-text pages and conversion warnings; distinguish genuine blank/divider pages from possible OCR omissions. Chart interpretation remains a risk to measure, not a promised default capability.

Output: versioned structured artifact, deterministic blocks/chunks, and conversion diagnostics. Stop or mark partial failure when evidence locators cannot be preserved. Do not fall back silently to raw text sent wholesale to an LLM.

## Stage 2: Candidate fact extraction

Pass bounded structured blocks and a source-ID catalog to the LLM. Instruct it to discover meaningful claims, including nonnumerical assertions, rather than enumerate every token or table of contents entry. Require structured output with original subject/predicate/value, qualifiers, modality, time interpretation, confidence/uncertainty, and evidence selectors drawn only from the supplied catalog.

The application supplies document names and provenance. The model selects block/cell/span references; validation resolves them to source text and pages. If the model proposes a quotation to aid span selection, require a validated exact or explicitly mapped match and reconstruct the final quotation from source text. Reject unknown IDs, wrong-document references, invented quotes, unsupported values, and invalid types. Do not “repair” a missing citation by assigning the nearest page.

The validator checks reference existence, value support, required context, and coherent structure. Source entailment still needs evaluation; lexical support alone is not enough. Retry malformed schema output with bounded attempts, recording errors. Preserve rejected candidates for failure analysis. Document text is data and cannot override extraction instructions.

## Stage 3: Normalization

Use deterministic decimal parsing, punctuation/whitespace handling, known scale conversions (including lakh/crore/million/billion), unambiguous date parsing, and source-backed reporting-period expansion. Preserve exact values, ranges, approximation, sign, precision, currency, and units. Unknown or ambiguous conversions retain original text and a warning.

Use semantic interpretation for resolving entities, predicate paraphrases, and contextual definitions. Store the mapping and its justification, not just a destructive replacement. “Revenue from services” and “revenue from operations” require attention to traded goods; “team size” is not universally “employees.” Treat a period/date inherited from a heading as an evidence-backed interpretation.

Precision-aware comparison should distinguish equality from rounding-compatible agreement. Example: ₹81,415.38 million = ₹8,141.538 crore. A published whole-crore value of ₹8,142 can corroborate it when rounding is supported. Do not apply a generic percentage tolerance to all metrics, counts, and identifiers.

## Stage 4: Candidate retrieval

Node retrieves cross-document candidates using entity identity/aliases plus predicate/definition similarity. Rank using related metric, context, and semantic cues. Temporal overlap increases relevance but must not be a strict universal filter: annual/quarter and active/resigned pairs are needed for reconciliation. Likewise, do not filter to equal values because that would eliminate contradictions.

Start with deterministic normalized strings, alias registries, and a bounded fallback text-similarity search. Add embeddings if paraphrase recall remains poor; their scores are retrieval signals, not relation labels. Use configurable top-k and track truncation, candidate count, and recall on annotated pairs. Compare only accepted active-run facts and exclude identical fact IDs and repeated unordered pairs.

The role event pair needs semantic predicate relatedness (holds role versus resigned from role), not just exact predicate equality. Keep its candidate path testable. Cross-domain facts such as a company revenue and national GDP should be rejected as unrelated despite large monetary values.

## Stage 5: Relationship reasoning

For each pair provide both source assertions, normalized representations, evidence bundles, and dimension differences. Retrieve narrowly relevant supporting context if needed, with real evidence IDs. Ask the model to check entity, predicate, units, reporting period, scope, geography, population, methodology, vintage, and modality before choosing a label.

| Label | Required interpretation |
| --- | --- |
| CORROBORATED | Claims are equivalent for the relevant context, including justified unit/rounding differences |
| CONTRADICTED | Claims are incompatible in aligned context; explain why known reconciliation possibilities do not resolve them and qualify likely cases |
| RECONCILED | An apparent conflict has a supported contextual explanation allowing both assertions to hold |
| UNCERTAIN | Related claims lack sufficient evidence/context for a stronger conclusion |

Explanations must mention decisive dimensions and unresolved limitations. A difference in reporting vintage is not automatically a proven revision; a difference in date does not explain every inconsistent address. Forecasts from different publishers may differ without either source asserting the other is false. Do not choose the newer claim as true by default.

Validate relation schema, pair IDs, supporting evidence, and numeric computations deterministically. Confidence is labeled as an assessment. Persist output with model/prompt/version and input hashes. Failed reasoning attempts create issues, not fabricated relationships.

## Completion, cost, and observability

Track pages/blocks/chunks processed, accepted/rejected facts, candidate pairs, completed/failed comparisons, stage durations, retries, token usage, and cost when the provider exposes it. Set budgets on input size and concurrency before full-corpus runs; never silently truncate a PDF and call the run complete. A partial result must name the skipped pages/chunks/stages.

Cache immutable conversion output by file hash plus conversion version/settings, and extraction/reasoning by complete versioned inputs. Retry only transient failures with bounded backoff. Schema/grounding failures need diagnosis, not unlimited retries. Incremental ingestion reuses existing accepted facts and does not reprocess old PDFs, while reprocessing explicitly produces a new active version.
