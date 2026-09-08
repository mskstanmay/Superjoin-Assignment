# Technology choices

## Selected direction

| Component | Proposal | Reason and boundary |
| --- | --- | --- |
| Browser | React + Vite + TypeScript | Small evidence-focused application; no SSR requirement |
| Public backend | Node.js + Express + TypeScript | Upload, orchestration, persistence, and retrieval in one main service |
| Database | PostgreSQL | Relational provenance and transactions, with JSONB for flexible facts |
| Processing | Python HTTP service, proposed FastAPI + Pydantic | Focused typed processing contracts and LLM response validation |
| PDF understanding | Docling | User-selected structured document conversion and provenance |
| Semantic work | One configurable LLM API | Extraction and contextual reasoning behind a narrow provider adapter |
| File/artifact storage | Local persistent volume | Simple reproducible prototype with retained original PDFs |
| Development runtime | Proposed Docker Compose, plus optional native development | Coordinate database, API, processing service, and frontend without a separate infrastructure stack |

Pin exact versions and produce lockfiles in the implementation setup milestone after a dependency smoke test. No dependency compatibility has been validated in this documentation phase. Prefer a Python 3.12 environment as a starting proposal for the processing dependency test; the inspected host Python was 3.14.5. Do not assume the host interpreter is suitable for the eventual pinned OCR/PyTorch stack.

## Docling research boundary

The official [installation guide](https://docling-project.github.io/docling/getting_started/installation/) documents platform support and selectable OCR dependencies. The [document reference](https://docling-project.github.io/docling/reference/docling_document/) describes document items and provenance; the [serialization guide](https://docling-project.github.io/docling/concepts/serialization/) describes table span preservation. Consulted on 2026-09-08. These support using structured artifacts and testing the chosen OCR setup, but do not establish reliable extraction of these particular PDFs. Library APIs and exact dependencies must be verified against the pinned version during implementation.

Use Docling itself; the similarly named Docling Graph project is not required. Store structured JSON as the canonical conversion artifact; Markdown is a convenient readable export, not the sole evidence representation. Conversion settings, model assets, and OCR backend must be recorded for reproducibility. Plan first-run model downloads and persistent caches in setup documentation.

## Dependencies to defer

No Neo4j, graph UI, Redis, vector database, autonomous agent framework, or generalized RAG framework is needed for the first slice. Use SQL migrations and a small database access layer; choose ORM versus direct SQL based on clarity, not boilerplate generation. PostgreSQL text search or optional pgvector can be added if retrieval measurements justify them.

LLM provider/model and spending budget remain unresolved. Selection requires structured-output reliability, sufficient bounded context, accessible credentials, acceptable latency, and a measured trial on the difficult table/semantic cases. Keep the model configurable and server-only. Do not invent pricing, request keys in source files, or claim an untested model is adequate. Offline sample outputs support evaluation but must be visibly distinguished from live processing.
