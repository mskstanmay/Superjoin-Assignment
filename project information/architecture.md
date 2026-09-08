# Proposed architecture

## Ownership

React/Vite provides upload, processing state, facts, relationships, and evidence inspection. Express/TypeScript is the public API and owns uploads, database access, job orchestration, and retrieval. A Python HTTP service owns Docling conversion, semantic extraction, normalization helpers, entity/predicate interpretation, and pair reasoning. PostgreSQL stores persistent state. Original PDFs and larger versioned processing artifacts live on a local volume referenced by server-generated storage keys.

```text
React → Express API → PostgreSQL
             ↓
       bounded job runner → Python processing service
                               ↓
                    Docling → structured blocks
                               ↓
                    extraction → normalization
             ↓
       stored facts → candidate retrieval → Python pair reasoning
             ↓
       persisted relationships → React evidence inspection
```

This split follows the user's architecture. Python has no direct application database credentials. Node retrieves potentially related stored facts and gives Python bounded pair/context payloads; Python returns validated results for Node to persist. Shared contracts describe objects, not duplicate database ownership.

## Upload and jobs

`POST /api/documents` accepts one or more multipart PDFs, validates file signatures and size, hashes content, stores the file under a generated key, creates a document/job record, and returns HTTP 202 with per-file IDs and statuses. Partial batch rejection must identify each rejected file. A duplicate hash reuses the existing document in the same knowledge layer and reports that choice; an explicit future reprocess operation creates a new run rather than duplicating claims.

Use one Node process with a bounded background runner initially. Durable jobs live in PostgreSQL; an in-memory queue is only a wake-up mechanism. Claim jobs atomically and track heartbeats/attempts. On restart, recover stale running jobs into a retryable state. Start with one conversion at a time and configurable bounded LLM concurrency. No Redis is required for this prototype.

Node sends only approved file identifiers/bytes or a validated relative storage key to Python; never let an internal endpoint read an arbitrary supplied filesystem path. A shared volume is the simplest local/container option. Internal endpoints are not public upload alternatives.

Proposed Python interfaces: `/process` for conversion/extraction/normalization and `/reason` for bounded pairs. To avoid oversized responses, `/process` may return an artifact manifest whose content Node validates and ingests. Internal calls have explicit deadlines and request IDs. The public upload request ends immediately; it does not wait for Docling or an LLM. At prototype scale a bounded internal processing request is acceptable; a polling Python task API is a later option if timeouts become a practical problem.

## Public read contracts

| Endpoint | Purpose |
| --- | --- |
| `GET /api/documents` | Paginated documents with stage, status, progress, and warnings |
| `GET /api/documents/:id` | Metadata, job/run status, counts, failures, and artifact availability |
| `GET /api/documents/:id/file` | Original PDF for evidence review, with suitable content headers |
| `GET /api/facts` | Paginated facts filtered by document, entity, predicate, or quality state |
| `GET /api/facts/:id` | Full original/normalized fact and evidence bundle |
| `GET /api/relationships` | Paginated/filterable results with both facts and reason |
| `GET /api/relationships/:id` | Detailed comparison, supporting evidence, run metadata |

Use consistent error objects containing code, message, request ID, and retryability, with no secrets or raw provider errors. Poll document status while work is active; stop polling terminal states. Extraction completion and comparison completion are separate stage outcomes. A reasoning failure must not make extracted facts disappear or falsely label comparison complete.

## Transactions and incremental behavior

Use a processing-run ID on artifacts, facts, and relationships. Stage extracted output, validate evidence, then publish a coherent fact set transactionally. Preserve diagnostics for rejected candidates. Existing completed results remain readable during reprocessing. Relationship writes are idempotent on canonical pair IDs and reasoning version; unordered duplicates must not appear.

On a new document, retrieve candidates between its accepted facts and existing active facts. Do not reconvert prior PDFs. Same-document duplicates can be grouped internally while preserving all evidence; cross-document assertions remain distinct so the UI can display both sources. Incremental behavior should be measured against a clean batch run on the same corpus. No automatic “latest document wins” policy.

## Operational boundaries

Validate document size/page/resource limits and show configured limits in the UI. Treat PDF content as untrusted input, including prompt-like instructions in documents. Model prompts must restrict document content to data and give no authority to issue tool calls or select file paths. Use environment variables for credentials, limit service exposure, and redact logs. The local prototype assumes a single user; adding remote multi-user deployment requires separate authorization and data isolation work.
