# Implementation plan

This plan is ready for a future implementation instruction. The current task ends after documentation. Commit titles below are suggestions for logical local development checkpoints, not commits already made.

## 1. Establish contracts and reproducible runtime

Create backend/frontend/python-service/tests only after implementation is authorized. Pin dependencies, create environment examples without keys, migrations, and a small Compose setup. Define the document, fact, evidence, issue, and relationship contracts from the data model. Verify the Python/Docling dependency stack on the chosen runtime with a tiny fixture. Select the LLM provider/model and budget before making paid extraction calls.

Exit: all services start with health checks, database migration works, and a clean checkout has precise setup instructions. Suggested commit: `initialize project structure and service contracts`.

## 2. Upload and structured document understanding

Build upload validation, hash/idempotency, original storage, durable job/status handling, and the Python conversion boundary. Convert representative prose, spread, table, and OCR pages. Save structured artifacts and block provenance before integrating LLM extraction. Verify physical versus printed pages and retained table headers visually.

Exit: a document has inspectable structured blocks with authentic page references, or a meaningful conversion issue. Suggested commits: `add PDF upload and processing jobs`; `add Docling document processing and provenance`.

## 3. Grounded fact extraction and persistence

Implement bounded structured LLM extraction, evidence selector validation, rejection diagnostics, and deterministic normalization. Persist accepted facts and evidence transactionally. Test numerical and semantic assertions, including roles, tables, and missing qualifiers. Keep source assertions separate from canonical mappings.

Exit: manually reviewed facts resolve to original blocks and incorrect evidence cannot enter accepted results. Suggested commits: `add structured fact extraction`; `add normalization and grounded fact persistence`.

## 4. Candidate matching and contextual reasoning

Implement cross-document candidate retrieval and assess recall on annotated pairs. Include differing values and time/event pairs. Add pair reasoning with structured dimensions, explanations, uncertainty, and supporting evidence. Persist idempotent pair results and failed-comparison issues.

Exit: candidate recall and final labels can be inspected independently; at least one defensible example of each successful relationship class is produced, or the unmet case is explicitly logged for further testing. Suggested commits: `add candidate matching`; `add contextual relationship reasoning`.

## 5. Complete the evidence inspection UI

Build upload/status, document list/detail, fact evidence panel, relationship grouping/detail, and failure view. API work needed for earlier milestones can precede this UI milestone. Focus on end-to-end evidence inspection before styling. Show partial outcomes and sample mode honestly.

Exit: all required behaviors can be demonstrated without editing the database or embedding expected results in frontend code. Suggested commit: `add fact and relationship inspection UI`.

## 6. Test generalization, failures, and incremental ingestion

Run both provided corpora within measured resource budgets and at least one additional PDF if available. Record a real extraction/reasoning failure and its handling. Verify retries/restarts and processing only the new PDF. Add semantic retrieval only if measured candidate misses justify it. Refine thresholds on a development set and retest held-out cases.

Exit: reproducible evaluation report with actual outputs, limitations, and versioned failure records. Suggested commits: `add demo case evaluation and failure records`; `improve incremental processing and recovery`.

## 7. Prepare submission

Write the root README using README-notes.md, validate setup from a clean environment, export enough sample results for evaluation without a paid account, and record a ≤3-minute video. Ensure required cases are visible and genuine. Review secrets and ignored artifacts. Create/publish the repository and submission links only as part of an authorized submission workflow.

Exit: setup verified, links real, sample results labeled, and all official README sections present. Suggested commit: `document setup approach limitations and demo`.

## Scope controls

The core path is upload → structured evidence → facts → candidates → explained relationships → inspection. Defer chart-model experimentation, embeddings, distributed jobs, advanced highlighting, and UI polish until this works. Large starter files make time/memory measurement necessary, but distributed infrastructure is not the first response. If a feature cannot be made reliable, narrow and disclose its behavior while preserving general input handling.
