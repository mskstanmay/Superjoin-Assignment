# Working project specification

Prepared from the repository on 2026-09-08. This is the specification/discovery phase; application implementation has not begun. The user's subsequent “go ahead” continues this documentation task. The explicit instruction to stop before application code remains in effect.

## Authority and reading order

The official assignment and supporting material in `reference/` are the primary source of truth. User directions select the architecture and workflow within the assignment's open design space. Proposals here explain how to implement that direction; they do not add official grading requirements.

1. [Assignment](assignment.md): obligations, scope, and acceptance criteria.
2. [Reference inspection](reference-inspection.md): inventory, evidence locations, layout findings, and limits of inspection.
3. [Architecture](architecture.md) and [tech stack](tech-stack.md): component ownership and runtime choices.
4. [Data model](data-model.md) and [processing pipeline](processing-pipeline.md): implementation contracts and evidence invariants.
5. [UI](ui.md): upload, inspection, and demonstration flows.
6. [Testing](testing.md): candidate cases, evaluation, and failure reporting.
7. [Implementation plan](implementation-plan.md): dependency-ordered milestones and exit criteria.
8. [Decisions](decisions.md): rationale, alternatives, and unresolved choices.
9. [README notes](README-notes.md): eventual submission documentation and demo checklist.

## Current state

The initial repository contained `.git/` and `reference/`, with one commit, `54d2782 Reference Files`, and no application, dependency manifests, tests, or root README. No repository `AGENTS.md` was found. The working tree was clean before discovery. No credentials, LLM service, database, or runtime configuration were needed for this inspection.

All six starter PDFs were inspected through page/text metadata and targeted content searches; selected evidence/layout pages were read and rendered. This was not a line-by-line audit of every disclosure. No Docling conversion or LLM extraction was run. Candidate outcomes are human-reviewed test hypotheses, not measured application results.

Future sessions should update these documents when an experiment changes a decision, retaining the distinction between observed behavior, desired behavior, and proposed improvements. Keep fixture expectations in tests, never in the extraction or matching runtime.
