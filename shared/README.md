# Contract v1

`processing/app/contracts.py` is the authored model source. Committed JSON Schema
2020-12 files in `contracts/` are the wire interface. Python validates JSON with
Pydantic; Node validates the same schemas with Ajv. Generated TypeScript types are
used by frontend/backend. Drift checks run independently of live processing.

Regenerate from the repository root:

```sh
uv run --directory processing python -m app.export_contracts
npm run contracts:types
python scripts/create-contract-fixtures.py
```

Decimal amounts cross JSON as strings. Physical pages are one-based; printed
labels can be multiple. Text-span offsets are Unicode code points and end-exclusive.
Storage keys are generated relative POSIX identifiers. Node assigns document/run
identity; models may eventually select evidence IDs but cannot supply authoritative
quotes/pages. Selector bounds, same-run ownership, value support and semantic
entailment require additional ingestion checks, beyond structural JSON validation.

`POST /process`: version, request/document/run/lease IDs, storage key/hash,
versions and limits → versioned artifact manifest, counts and issues.
`POST /reason`: bounded cross-document fact/evidence pairs → relationships/issues.
Both currently return HTTP 501 with `ApiError` after request validation. No fake
facts, relationships or progress are emitted. Every error includes code, safe
message, request_id and retryable. Additive/breaking changes must update the
contract version deliberately and regenerate fixtures/types.

Fixtures are authored generic examples, not source evidence or runtime answers.
