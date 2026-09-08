# Milestone 1 verification

Native Windows verification performed 2026-09-09. No LLM calls or paid API usage.

| Check | Result |
| --- | --- |
| `npm ci` | Lockfile installation succeeded |
| `npm run build` | Contract drift checks, backend TypeScript, frontend TypeScript/Vite passed |
| `npm test` | 46 tests passed, including 43 shared contract fixtures |
| `npm run migrate` | Migration applied successfully to PostgreSQL 17.11 |
| `npm run test:db` | Real PostgreSQL integration test passed; migration replay, ownership, pair uniqueness and historical results checked |
| `uv sync --frozen --directory processing` | Python 3.12.14 environment installed from lockfile |
| `python -m app.export_contracts --check` in processing | 15 schema files match authored models |
| `pytest -m 'not docling' -q` in processing | 52 tests passed |
| `pytest -m docling -q` in processing | Real Docling conversion test passed |
| `python -m app.docling_adapter.smoke` in processing | 1 page, 2 blocks, physical page 1, no LLM calls |
| `npm run check:runtime` | Frontend served; Node→PostgreSQL and Node→Python healthy, also through Vite proxy |
| Native PostgreSQL stop/start, migration replay, runtime check | Passed; persistent schema retained and service connectivity restored |
| Native `/process` and `/reason` | Valid requests return explicit 501; malformed requests are rejected |
| Compose 5.5.1 `config --quiet` | Configuration valid; no DB credentials in processing environment, no Python/DB published ports |

The database test uses a new isolated schema and drops that schema afterward.
Malformed fixture tests establish structural validation, not future semantic quality.
No extraction/reasoning success case is claimed. Baseline PyMuPDF observations in
the source specifications remain separate from this successful Docling smoke test.

Docker Engine/Desktop is absent. Container builds and full Compose startup are
explicitly unverified. Original source documents were not edited.

A fresh source snapshot (excluding ignored dependencies and secrets) independently
passed `npm ci`, `uv sync --frozen`, build, Node tests, Python contract/service tests,
schema drift checks, and real PostgreSQL integration. Its separate Python virtualenv
also ran the Docling smoke successfully: 1 page, 2 blocks, physical page 1, 33.328
seconds after imports, reusing the previously downloaded public model cache.

An optional headless-browser launch was blocked by automatic approval review with
the reason "blocked by policy". Frontend verification covers TypeScript/Vite build,
HTML delivery and the live proxy; browser rendering was not verified.
