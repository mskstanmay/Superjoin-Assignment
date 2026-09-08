# Proposed data model

## Principles

Facts are source assertions, not globally certified truths. A fact combines subject, predicate, typed value, context, and evidence. Preserve original wording alongside normalized fields. Unknown qualifiers remain unknown: absence of a date, scope, unit, or negation marker must not silently become a default.

Use stable relational columns for identity, joins, statuses, and searchable common dimensions; JSONB accommodates typed values and open-ended qualifiers. New predicates must not require SQL migrations. A generic structural schema is compatible with the assignment's warning against hard-coded starter schemas. Avoid a fixed list of business metrics or domain-specific columns.

## Entities and tables

| Table | Principal fields and responsibility |
| --- | --- |
| `documents` | UUID, original filename, SHA-256, storage key, content type, page count, metadata, status, active run ID, timestamps |
| `processing_runs` | UUID, document ID, stage/status, attempt, heartbeat, pipeline/model/prompt/schema versions, start/end, usage and diagnostics |
| `document_blocks` | UUID, run/document ID, stable local Docling item reference, label/type, original extracted text, structure JSONB, parent/section/order, provenance list |
| `document_chunks` | UUID, run ID, ordered block references, deterministic contextualized text, token count, chunk policy version |
| `facts` | UUID, run/document ID, assertion text, subject original/canonical IDs, predicate original/canonical IDs, value JSONB, time JSONB, qualifiers JSONB, polarity, modality, confidence, quality state |
| `fact_evidence` | Fact ID, block ID, role, source span/cell selector, pipeline-derived quote, provenance selector, validation status |
| `entities` / `entity_aliases` | Generic entity identity and aliases, type hint, resolution rationale/confidence; retain original mentions |
| `predicates` / `predicate_aliases` | Open vocabulary with interpretation notes and proposed canonical mapping; no automatic loss of definitions |
| `relationships` | UUID, canonical fact pair, type, explanation, dimension comparison JSONB, confidence, uncertainty, supporting evidence IDs, reasoning run/version |
| `processing_issues` | Run/stage, code, affected block/fact/pair IDs, severity, observed problem, action taken, retryability, resolution |

The first migrations can combine small alias registries where simplicity warrants it, but identity and original mention must remain separable. Chunk-to-block membership needs ordering and referential integrity, whether represented by a join table or validated references. PostgreSQL foreign keys protect cross-table references; application validation additionally checks that referenced evidence belongs to the correct document/run.

## Typed values

Represent numerical amounts using decimal strings at JSON boundaries and PostgreSQL NUMERIC for indexed scalar values when needed. Avoid JavaScript floating-point arithmetic for money or large counts. A value object contains kind (number, range, text, entity, boolean, date, or other), original text, parsed/normalized value, unit, scale, comparator, approximate flag, precision, and normalization status/rule version. Original semantic text remains available even when no reliable normalization exists.

Ranges retain lower/upper bounds and inclusivity. “More than 2.8 billion” is a lower-bound assertion; “approximately 740 million” is not an exact count. Negative values represented by parentheses remain negative. Missing markers such as an em dash or ellipsis are not universally zero. Preserve currency identity separately from magnitude and do not apply live exchange rates.

For addresses and roles, keep a text/entity value with generic structured attributes where useful. Address postal codes remain strings; their disagreement cannot be removed by punctuation/case normalization. A company rename can be resolved with source evidence, but a subsidiary cannot automatically be merged with its parent.

## Time and qualifiers

Time objects preserve original label, kind (instant, interval, fiscal year, quarter, half-year, unspecified), start/end if justified, calendar basis, year-label convention, and resolution status. Store publication date, observation/as-of date, effective date, and reporting interval separately. Fiscal-year normalization needs source support; do not universally assume April–March. The IMF page 45 footnote supplies that basis for its tables.

Qualifiers are extensible key/value assertions with evidence references: organization scope, geography, population, business segment, measurement basis, denominator, methodology, nominal/real basis, base year, seasonality, annualization, estimation vintage, scenario, and inclusion/exclusion rules. These are examples discovered in the sources, not a closed enum of allowed contexts. Modality distinguishes historical assertions, estimates, forecasts, targets, and conditional scenarios. Polarity and role-ending events must survive extraction.

## Provenance and evidence validation

Each block may have multiple provenance entries: uploaded PDF page (1-based), optional printed label(s), optional explicitly supplied original page mapping, bounding box, coordinate origin, page dimensions, and text/cell span metadata. The original PDF is authoritative when the text layer/OCR is wrong. Keep raw Docling output so later validation can revisit conversion decisions.

A fact may require evidence from several blocks: value cell, row header, column header, unit label, footnote, and date context. Evidence role identifies these contributions. Quotes are generated from referenced pipeline content, never accepted as standalone model assertions. Preserve exact original text and a separate display-normalized version with mappings if whitespace normalization is used. A page number is derived from validated blocks, not a model field.

Grounding validates existence and location; it does not prove entailment. A model can cite a real nearby number and still attach the wrong metric/year. Retain semantic review/quality flags and evaluate them separately from exact span matching. An ungrounded candidate remains an issue/quarantined record and must not enter accepted-fact relationships.

## Relationship representation

For each pair store the two fact IDs, CORROBORATED/CONTRADICTED/RECONCILED/UNCERTAIN, explanation, structured dimension comparisons, confidence source, unresolved context, and any supporting third evidence. Different dates can explain an apparent conflict; missing dates cannot establish reconciliation. Unrelated pairs are filtered out and recorded as such in diagnostics rather than cluttering UNCERTAIN results.

Confidence is an uncalibrated model or rule assessment unless calibration is actually measured. Separate extraction confidence, grounding validity, candidate similarity, and relationship confidence. Do not multiply arbitrary scores into a purported probability of truth. Preserve source publisher/attribution so corroboration of two documents is not misrepresented as two independent measurements.

Index document/run foreign keys, hash, entity/predicate canonical IDs, and common time fields. Add text/trigram or embedding indexes only after retrieval evaluation shows need. Store accepted source facts individually; deduplication groups repeated evidence without deleting provenance or collapsing the two claims needed for comparison.
