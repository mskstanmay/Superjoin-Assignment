# Testing and demo cases

## Status and source of expectations

No application, Docling run, or LLM result exists yet. The evidence register in [reference-inspection.md](reference-inspection.md) supplies candidate gold annotations. Human-reviewed source claims are test inputs/expectations only; the application must discover them using the generic pipeline. The current PyMuPDF failures are baseline inspection findings, not completed assignment demonstrations.

## Four candidate demo cases

| Case | Source pair / observed input | Expected interpretation and caveat |
| --- | --- | --- |
| Corroboration | Delhivery annual page 22: consolidated FY24 ₹81,415.38 million; deck page 23: FY24 ₹8,142 crore revenue from customers | CORROBORATED if metric/scope is verified, with explicit conversion and rounding; preserve original values |
| Genuine or likely contradiction | Prospectus page 30 corporate office postcode 122002; annual page 51 item 5 postcode 122001 | Likely CONTRADICTED, strengthened by annual pages 30–31 and 47 repeating 122002; unresolved postal/date context may warrant UNCERTAIN |
| Apparent contradiction | Prospectus pages 30/84: Sandeep Kumar Barasia holds the role; annual page 39: resignation effective July 1, 2024 | RECONCILED through time/event context; do not treat a planned appointment term as guaranteed tenure |
| Failure | IMF page 1 has a visible title but baseline PyMuPDF text extraction returns empty | Actual baseline omission; use as an OCR regression case. Final demo must record what the implemented pipeline actually does, or substitute another observed Docling/extraction/reasoning failure |

If the postcode case remains uncertain after review, do not force it into contradiction to satisfy the checklist. Find another natural conflict in tested documents, or discuss use of clearly labeled supplemental test PDFs. The provided brief does not promise an unambiguous contradiction exists in every trio. Never alter starter evidence or present authored fixtures as official documents.

Backup reconciliation: FY24 versus Q4 FY24 revenue (annual page 4/deck page 7). Backup corroboration: 740 million FY24 express parcels (annual page 4/deck page 6). Macroeconomy transfer tests: CPI 4.6% (RBI page 39/IMF page 10), reserves US$668.3 billion (RBI page 12/IMF page 53), GDP estimate vintage (Survey pages 4/14 versus RBI pages 8/23–24), and differing import-cover denominators (RBI page 12/IMF page 45).

## Observed failure record F-001

Date: 2026-09-08. Tool: installed PyMuPDF, `page.get_text('text')`. Input: supplied IMF excerpt, PDF page 1. Expected: visible title identifying the India 2025 Article IV report. Actual: zero extracted characters. Detection: per-page character count, followed by rendered-page inspection. Handling in this phase: read the rendered title and record the omission; no application output was silently repaired. Likely cause: content not accessible through ordinary text extraction; exact encoding/layout cause not established. Improvement to test: Docling OCR with retained page evidence and a coverage warning if recovery fails. This establishes a real baseline failure, but does not demonstrate that Docling fails or that OCR has fixed it.

F-002 is a risk/structural-loss observation, not a measured wrong fact: ordinary text from deck page 9 interleaves chart labels and numbers. Verify FY24 PTL tonnage 1,429 thousand tons versus revenue 1,517 crore against the rendered chart. If the implemented extractor swaps them, preserve the actual output as a semantic grounding failure even when the number itself occurs on the page.

## Test layers

Deterministic unit checks: crore/million/lakh conversion, decimal precision, parenthesized losses, ranges, approximate/lower-bound values, percentages versus percentage points, unknown currency, missing markers, fiscal ambiguity, role-end dates, alias normalization without parent/subsidiary collapse, and unordered pair deduplication.

Provenance checks: every accepted fact has evidence; all IDs resolve to the correct document/run; pages are within bounds; quotes originate in stored blocks; table facts include row/year/unit context; spread coordinates retain their origin/dimensions; missing model citations are rejected. Add adversarial responses with invented block IDs, valid IDs from the wrong document, and genuine quotes supporting the wrong year. Distinguish reference validation from semantic entailment.

Integration checks: upload/new document, duplicate upload, corrupt/encrypted input, conversion timeout, malformed structured LLM output, provider rate limit, database write failure, restart during processing, partial comparison failure, idempotent retries, and retrieval pagination. Mocked provider responses test orchestration but cannot establish semantic quality. Run a small paid/live smoke test separately after provider setup.

End-to-end checks: upload a starter PDF and an unseen PDF through the public interface; inspect facts/evidence and cross-document pairs; verify failure visibility. Process document B after document A and confirm A is not reconverted. Compare incremental relationships against a clean batch run using the same versioned inputs and account for model nondeterminism.

## Evaluation protocol

Create a small manually annotated set across prose, financial tables, governance facts, charts, and macroeconomic tables. Annotate source evidence, all decisive qualifiers, acceptable labels, and uncertain cases before tuning. Hold out some pages or documents for evaluation; use at least one genuinely new domain/document when available. The second supplied trio is a domain-transfer test but is still starter data.

Report fact precision and sampled recall, provenance validity rate, qualifier accuracy, candidate-pair recall before reasoning, and relationship confusion/abstention rates on the annotated set. Report denominators and failure categories. A candidate missed by retrieval is not a reasoning-model error. Measure time per stage, pages/minute, candidate counts, LLM usage, and peak memory where practical. No numeric performance target is an official requirement; set implementation targets only after baseline measurement.

Acceptance gate: all displayed facts have valid evidence links; the three relation demo cases have defensible source-backed explanations; an actual pipeline failure is documented; and an unseen PDF runs without filename/domain rules. If a gate fails, report it rather than substituting curated output for a live result.

## Failure log template

Record ID/date, file hash and physical page, pipeline/model/prompt versions, expected result and annotation basis, actual output, stage/cause hypothesis, detected automatically versus human-found, handling/retry/quarantine, remaining impact, and tested or proposed improvement. Keep before/after evidence. Do not call a proposed fix successful until rerun results support it.
