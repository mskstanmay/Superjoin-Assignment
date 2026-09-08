# UI specification

## Primary experience

Provide a simple React workspace with Upload/Documents, Facts, Relationships, and Processing issues. The purpose is to inspect what the system extracted and why it compared claims. Prefer readable tables and evidence panels over elaborate graphics. Each route needs loading, empty, error, and partial-result states.

## Upload and documents

Accept one or more PDFs by file picker or drag-and-drop. Display per-file validation errors, queued/running stage, accepted-fact count, and completion or failure. Do not show fabricated percentage progress; use stage and measured counts when the total is known. Repeated uploads should explain reuse of an existing document.

The documents list shows filename, page count, processing state, warnings, and counts. A detail view shows metadata, run stages, retryable issues, and the original PDF. Extraction can be complete while relationship reasoning is pending or partly failed; make that distinction visible.

## Facts and evidence

List subject, predicate, original value, normalized value/unit, reporting period, key qualifiers, and confidence/quality. Text/role/event facts should work as naturally as numeric facts. Filters include document, entity, predicate, and quality state; pagination avoids loading an entire corpus.

Selecting a fact opens evidence: original filename, uploaded PDF page, optional printed label, quote or table fragment, and the relevant context headers/footnotes. Show multi-block evidence together. Link directly to the original PDF page. Region highlighting is optional, but provenance should permit it later. For annual-report spreads, say “PDF page 51; printed page 100” only when that printed location is known; otherwise show the available page labels without guessing.

Use separate labels for extracted statement, source text, and normalized interpretation. Explanations must not visually masquerade as quotations. Confidence should be described as model-assessed unless calibrated. Quarantined candidates belong under issues, not among accepted facts.

## Relationships

Group/filter by corroborated, contradicted, reconciled, and uncertain. A relationship detail shows Fact A and Fact B with document, period/scope, original value, normalized representation, evidence, explanation, confidence, and unresolved context. A compact dimension comparison is useful for units, time, scope, and definitions. Display supporting third evidence where the explanation depends on it, as with the postcode investigation.

Human-selected demo examples may be bookmarked by result IDs after a real run. They must remain ordinary pipeline results. Do not make a UI badge or prefilled fixture determine a classifier output. In the likely-contradiction case, preserve the word “likely” in the explanation and do not claim to know the correct postcode.

## Failures and evaluation mode

An issue view shows stage, affected source, observed output, why it was rejected or wrong, action taken, and proposed improvement. Distinguish a detected grounding error from a semantic error found only through human review. The required failure demo should be easy to access beside the successful relationships.

If reviewers use saved sample outputs without an API key, show a persistent sample/read-only indicator, run metadata, and original evidence. Do not display a fake processing animation as a live run. The final video must include actual PDF processing as required by the brief.
