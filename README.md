# Superjoin Challenge

## MVP implementation status

The working MVP now provides the vertical slice requested by the challenge:

```text
PDF upload -> local storage -> Docling blocks/chunks -> grounded facts/evidence
           -> normalized candidate comparison -> relationship inspection
```

The frontend exposes Documents, Facts, and Relationships views. Uploads are
validated as PDFs, hashed with SHA-256, processed synchronously through the
private Python service, and persisted in PostgreSQL. Fact evidence is rebuilt
from stored Docling blocks, so the UI displays the source quote and physical PDF
page rather than trusting model-supplied page numbers.

### MVP run

Use the existing native setup, then start the services in separate terminals:

```powershell
npm run migrate
npm run dev:processing
npm run start -w backend
npm run dev -w frontend
```

Open `http://127.0.0.1:5173`, upload two PDFs, wait for processing, then inspect
Facts and Relationships. The public endpoints are `POST /api/documents`,
`GET /api/documents`, `GET /api/facts`, `GET /api/facts/:id`,
`GET /api/relationships`, and `GET /api/relationships/:id`.

### What was verified here

- `npm run build -w backend`
- `npm run build -w frontend`
- `npm test -w backend` (46 tests passed)
- Python syntax compilation with `python -m compileall processing/app`

The actual starter PDFs were not processed in this environment because the
documented `uv` executable is unavailable on the current PATH. No relationship
example is claimed as discovered from the starter corpus yet.

### MVP limitations

The local path is intentionally synchronous and single-user. Candidate matching
and relationship classification currently use deterministic rules; configure the
processing service's selected LLM before relying on semantic extraction or
contextual reconciliation. The fallback extractor is conservative and marks
its facts as uncertain. OCR, complex tables/charts, retries, authentication,
and production deployment remain outside this MVP.

Milestone 1 implements the contracts and runtime foundation. It does **not** yet
accept PDF uploads, extract facts, or reason about relationships. `/process` and
`/reason` validate their inputs and return an explicit HTTP 501; they do not emit
fabricated AI output. The React page shows actual service health only.

The original documents in [`project information/`](project%20information/README.md)
remain unchanged historical planning material. This README describes the current
implementation authorized after that planning phase.

## Setup and Run Instructions

### Tested versions

Native verification uses Windows, Node **24.16.0**, npm **11.17.0**, Python
**3.12.14**, uv **0.12.10**, and PostgreSQL **17.11**. Package versions are pinned in
`package-lock.json` and `processing/uv.lock`. Docling is **2.126.0**. Linux PyTorch
dependencies use CPU wheels to avoid downloading a CUDA runtime for this prototype.

The four-service Compose configuration is provided and validated with Compose
**5.5.1**. **Container image builds and `compose up` have not been executed on this
machine because no Docker Engine/Desktop is installed.** Native services,
migrations, HTTP connectivity, contract tests, and real Docling conversion have
been executed. Do not confuse configuration validation with container validation.

### Docker Compose (configured; container execution not yet verified)

Install Docker with Compose. From the repository root, initialize local settings:

```sh
node scripts/init-native-env.mjs
docker compose config --quiet
docker compose up --build -d --wait
```

The initializer reads `.env.example`, generates a random development DB password,
and creates ignored `.env`; it refuses to overwrite an existing file. Although it
sets native DB port 55432, Compose builds its own internal connection URL using
`postgres:5432`. Alternatively copy `.env.example` and replace the password. Use a
URL-safe password or encode it in connection URLs. No LLM credentials are needed.

Open:

- Frontend: <http://127.0.0.1:5173>
- Backend health: <http://127.0.0.1:3000/health>

Backend startup applies checked SQL migrations before serving HTTP. Python and
PostgreSQL have no published host ports. The frontend's `/backend` proxy forwards
to Node; Node checks Python over the Compose network.

Commands for the configured container environment:

```sh
docker compose exec backend npm test
docker compose exec backend node /app/scripts/test-database.mjs
docker compose exec processing python -m app.export_contracts --check
docker compose exec processing pytest -q
docker compose exec processing python -m app.docling_adapter.smoke --output /data/artifacts/docling-smoke
docker compose logs backend processing
docker compose down
```

`down` retains named database, upload, artifact and model-cache volumes. Do not use
`down -v` unless intentionally discarding local data. Initial model conversion
downloads public layout weights; subsequent conversions reuse the cache.

### Native Windows (executed)

Install Node 24, uv 0.12.10, and obtain PostgreSQL 17.11 binaries from the
[official PostgreSQL Windows download page](https://www.postgresql.org/download/windows/).
The PostgreSQL helper accepts any explicit installed `bin` directory; it does not
install a Windows service or modify an existing cluster.

```powershell
npm ci
uv sync --frozen --directory processing
node scripts/init-native-env.mjs
./scripts/native-postgres.ps1 -Action start -BinDirectory 'C:/path/to/pgsql/bin'
npm run migrate
npm run build
```

On the development machine used for verification, binaries live in ignored
`.local-tools/pg-runtime/pgsql/bin`, the helper's default. A fresh checkout must
provide its own PostgreSQL binaries. The helper creates its own cluster under
`.runtime/postgres-data`, uses SCRAM password authentication and binds to loopback
port 55432. `-Action start` reuses an existing initialized cluster.

In three terminals at repository root:

```powershell
npm run dev:processing
```

```powershell
npm run start -w backend
```

```powershell
npm run dev -w frontend
```

The Python launcher reads only allowlisted processing settings from `.env`, strips
database variables from its child environment, and runs the locked virtualenv.
Never pass the entire root `.env` to Python. Native Python binds to loopback port
8000. Its `/docs` exposes the initial OpenAPI contracts.

Verify and stop:

```powershell
npm test
npm run test:db
uv run --directory processing python -m app.export_contracts --check
uv run --directory processing pytest -q
$env:NATIVE_PROCESSING_URL = 'http://127.0.0.1:8000'
npm run check:runtime
./scripts/native-postgres.ps1 -Action stop -BinDirectory 'C:/path/to/pgsql/bin'
```

Stop each Node/Python/frontend terminal with Ctrl+C. Database integration tests
create and drop a uniquely named test schema, not the application database. Set
`TEST_DATABASE_URL` to use a separate test database; otherwise the test launcher
uses the configured development database. The test role needs schema creation.

### Configuration and storage

`.env.example` contains names, development defaults and placeholders. Actual
credentials, local tools, virtualenvs, databases, generated logs and model caches
are ignored. Relative native storage paths are resolved from the service working
directory. Compose uses absolute volume paths.

- Backend requires `DATABASE_URL`, `PROCESSING_SERVICE_URL`, `UPLOAD_ROOT`, and
  `ARTIFACT_ROOT`. It validates job limits, heartbeat/lease settings and log level.
- Python requires upload/artifact/cache paths and rejects database configuration
  at startup. Provider, model, concurrency, OCR and processing limits are typed.
- `LIVE_LLM_ENABLED=false` is the foundation default. Enabling it requires complete
  provider/model/key configuration, but semantic stages are still unimplemented.
- Frontend requires `VITE_API_BASE_URL`. `BACKEND_PROXY_TARGET` is Vite's server-side
  proxy target and is not a browser credential.

The initial configured limits are 100 pages and 20,000,000 bytes. These are
development defaults, **not tested production capacity or implemented upload
limits**. No upload endpoint exists in this milestone.

## Video Demo

<video src="Superjoin%20Demo.mp4" controls width="800"></video>

[Download the demo video](Superjoin%20Demo.mp4)

## Approach

```text
React/Vite → Express/TypeScript → PostgreSQL
                    ↓
             private FastAPI service → Docling
```

Node owns all application database access, migrations, and future durable job
orchestration. Python owns document processing and future semantic reasoning.
Candidate retrieval remains Node-owned. This milestone creates no job runner,
prompts, provider calls or business endpoints beyond health.

### Contracts

[`shared/README.md`](shared/README.md) describes 15 versioned DTO contracts.
Pydantic models generate committed JSON Schema 2020-12 and TypeScript declarations.
Ajv and Pydantic validate the same 43 valid/invalid fixtures. CI-style drift checks
detect models/schema/types diverging. Amounts are decimal strings; physical pages
are one-based; printed page labels are separate and may be multiple.

`POST /process` receives application document/run/lease IDs, a generated relative
storage key, file hash, versions and bounded limits. Its future successful response
is an artifact manifest. `POST /reason` receives at most 20 fact/evidence pairs.
Both currently return `ApiError` with `STAGE_NOT_IMPLEMENTED`, `retryable=false`,
and the request ID after validation. Invalid bodies return 422; oversized internal
requests return 413. No fake completed processing status is returned.

### Database

[`001_foundation.sql`](database/migrations/001_foundation.sql) creates all twelve
agreed tables plus ordered `document_chunk_blocks` membership. `processing_runs`
holds durable job state, attempts, heartbeats, leases, versions and checkpoints;
there is no Redis or separate queue system. A checksummed migration-history table
tracks applied migrations under a PostgreSQL advisory lock.

Composite foreign keys bind blocks/facts/evidence to their document and run.
Relationships retain canonical unordered pairs and reasoning versions. Duplicate
hashes and repeated pair/version/input combinations are rejected. A trigger guards
active-run publication; old facts and relationships remain stored after switching.

The future ingestion transaction must validate coherent fact sets before setting
`facts_published_at`. SQL ownership constraints and a publication marker do not
establish semantic grounding or automatically prove that a cited value is correct.
JSONB evidence references and selectors still require ingestion validation in the
appropriate later milestone.

### Docling proof

```sh
uv run --directory processing python -m app.docling_adapter.smoke
```

The authored [`tiny.pdf`](tests/fixtures/tiny.pdf) is 671 bytes, one physical page.
The real Docling `StandardPdfPipeline` produced **two text blocks**, both on physical
page **1**, with bounding boxes and page dimensions. The first measured conversion
took **72.516 seconds**, including first-use work. It made **zero LLM calls**.

Inspect the actual saved [`report`](samples/docling-smoke/report.json),
[`blocks`](samples/docling-smoke/blocks.json), and
[`structured Docling document`](samples/docling-smoke/docling.json).
Fresh smoke outputs go under ignored `.runtime/docling-smoke` by default.
OCR and table-structure inference are disabled for this tiny prose-only test;
it is not evidence of reliable tables, spreads, charts or OCR on the starter corpus.

Codex was used to implement and test this foundation. No runtime LLM provider has
been selected, no paid API was called, and no starter fact answers were embedded.

## Limitations and Next Steps

- Compose configuration is checked; Docker image builds/startup remain unverified
  on this host. Native runtime verification does not prove Linux container behavior.
- An optional browser-rendering check was blocked by automatic approval review.
  Frontend verification covers the build and live HTTP/proxy behavior.
- Docling/ML packages and public layout assets require significant download/cache
  space. GPU acceleration, OCR accuracy and full-corpus performance are unmeasured.
- Some upstream test/Docling dependencies emit deprecation warnings. The executed
  tests pass; these warnings are not suppressed or represented as application errors.
- Evidence existence is not semantic entailment. Accepted-fact publication and
  relationship reasoning do not exist yet.
- The default database role is for a single-user development prototype. Remote
  authentication and production deployment are outside this milestone.

Milestone 2 adds upload validation/deduplication, original-file storage, durable
job claiming/recovery, and real `/process` document understanding with structured
artifacts, blocks, coverage warnings and provenance. Full fact extraction, matching,
reasoning and the inspection UI remain in later milestones. Work stops here.

## Additional Notes

The [reference corpus](reference/starter-datasets/README.md) and
[assignment specification](project%20information/assignment.md) remain authoritative
for eventual demonstrations. Contract fixtures and the authored smoke PDF are
tests, not official documents or classifier answers. No final repository/video
submission was made in this milestone.

Working verification details are in [`tests/README.md`](tests/README.md).
Implementation uses the official [Docling conversion guidance](https://docling-project.github.io/docling/usage/advanced_options/)
and [uv platform-specific package indexes](https://docs.astral.sh/uv/configuration/indexes/).
