"""Authored generic wire examples only; never loaded by processing endpoints."""
from copy import deepcopy
from pathlib import Path
import json

def uid(n):
    return f"00000000-0000-4000-8000-{n:012d}"

counts = dict(pages_processed=0, pages_total=None, chunks_processed=0, facts_accepted=0,
              facts_rejected=0, comparisons_completed=0, comparisons_failed=0)
status = dict(status="queued", stage=None, counts=counts)
versions = dict(pipeline="foundation-1", schema_version="1.0", conversion="docling-smoke-1",
                chunking="pending", normalization="pending", model=None, prompt=None)
provenance = [dict(physical_page=1, printed_labels=[], original_page=None, bbox=None)]
time = dict(original_label=None, kind="unspecified", start=None, end=None, calendar_basis=None,
            year_label_convention=None, resolution_status="unspecified", publication_date=None,
            as_of_date=None, effective_date=None)
fact = dict(id=uid(10), document_id=uid(1), run_id=uid(2), candidate_key="fixture-1",
            assertion_text="The example collection contains 12 items.", subject_original="Example collection",
            subject_entity_id=None, predicate_original="contains", predicate_id=None,
            value=dict(kind="number", original_text="12 items", normalized="12", unit="item", currency=None,
                       scale="1", comparator="eq", approximate=False, precision=0,
                       normalization_status="normalized", rule_version="fixture-1"),
            time=time, qualifiers={}, polarity="positive", modality="asserted", confidence=0.9,
            uncertainty=[], quality_state="accepted", evidence_ids=[uid(20)])
evidence = dict(id=uid(20), fact_id=uid(10), document_id=uid(1), run_id=uid(2), block_id=uid(3),
                role="assertion", selector=dict(kind="block"), quote=fact["assertion_text"],
                provenance=provenance, validation_status="validated")
fact_b = deepcopy(fact)
fact_b.update(id=uid(11), document_id=uid(4), run_id=uid(5), evidence_ids=[uid(21)])
evidence_b = deepcopy(evidence)
evidence_b.update(id=uid(21), fact_id=uid(11), document_id=uid(4), run_id=uid(5), block_id=uid(6))
relationship = dict(id=uid(30), fact_a_id=uid(10), fact_b_id=uid(11), type="CORROBORATED",
                    explanation="Authored contract example: both assertions give the same item count.",
                    dimensions=[dict(dimension="unit", fact_a="item", fact_b="item", outcome="aligned",
                                     explanation="Both use items.", evidence_ids=[uid(20), uid(21)])],
                    confidence=0.8, confidence_source="rule", unresolved_context=[],
                    supporting_evidence_ids=[uid(20), uid(21)], reasoning_run_id=uid(5),
                    reasoning_version="fixture-1", model_version=None, prompt_version=None, input_hash="a"*64)
issue = dict(id=uid(40), run_id=uid(2), stage="extraction", code="STAGE_NOT_IMPLEMENTED",
             affected_ids=[], severity="info", observed_problem="Authored diagnostic example.",
             action_taken="No extraction attempted.", retryable=False, resolution=None,
             artifact_key=None, created_at="2026-09-09T00:00:00Z")
process = dict(contract_version="1.0", request_id=uid(50), document_id=uid(1), run_id=uid(2),
               lease_token=uid(51), storage_key="documents/example.pdf", sha256="a"*64, versions=versions,
               limits=dict(max_pages=2, max_bytes=100000, timeout_seconds=180, chunk_token_budget=2048))
valid = {
    "Document": dict(id=uid(1), original_filename="authored-example.pdf", sha256="a"*64,
                     storage_key="documents/example.pdf", content_type="application/pdf", size_bytes=671,
                     page_count=None, metadata={}, processing=status, active_run_id=None,
                     created_at="2026-09-09T00:00:00Z", updated_at="2026-09-09T00:00:00Z"),
    "ProcessingStatus": status,
    "ProcessingJob": dict(id=uid(2), document_id=uid(1), processing=status, attempt=0, heartbeat_at=None,
                          next_attempt_at=None, lease_token=None, versions=versions, checkpoint={}, started_at=None, ended_at=None),
    "DocumentBlock": dict(id=uid(3), document_id=uid(1), run_id=uid(2), local_ref="#/texts/0", label="text",
                          original_text=fact["assertion_text"], structure={}, parent_block_id=None,
                          section=[], reading_order=0, provenance=provenance),
    "DocumentChunk": dict(id=uid(7), run_id=uid(2), chunk_index=0, block_ids=[uid(3)],
                          contextualized_text=fact["assertion_text"], token_count=10, chunk_policy_version="fixture-1"),
    "Fact": fact, "Evidence": evidence, "Relationship": relationship, "ProcessingIssue": issue,
    "ProcessRequest": process,
    "ProcessResponse": dict(contract_version="1.0", request_id=uid(50), document_id=uid(1), run_id=uid(2),
                            lease_token=uid(51), status="failed", artifacts=[], counts=counts, issues=[issue]),
    "ReasonRequest": dict(contract_version="1.0", request_id=uid(50), run_id=uid(5), reasoning_version="fixture-1",
                          pairs=[dict(fact_a=fact, fact_b=fact_b, evidence=[evidence, evidence_b])]),
    "ReasonResponse": dict(contract_version="1.0", request_id=uid(50), run_id=uid(5), relationships=[relationship], issues=[]),
    "ApiError": dict(error=dict(code="STAGE_NOT_IMPLEMENTED", message="Not implemented.", request_id=uid(50), retryable=False)),
    "Health": dict(service="processing", status="ok", contract_version="1.0", checks=dict(contracts="ok")),
}
fixtures = []
for name, payload in valid.items():
    fixtures.append(dict(name=f"valid-{name}", contract=name, valid=True, payload=payload))
    invalid = deepcopy(payload)
    invalid["unexpected_field"] = "must be rejected"
    fixtures.append(dict(name=f"extra-field-{name}", contract=name, valid=False, payload=invalid))

def invalid_case(name, contract, mutate):
    payload = deepcopy(valid[contract])
    mutate(payload)
    fixtures.append(dict(name=name, contract=contract, valid=False, payload=payload))

invalid_case("number-must-be-decimal-string", "Fact", lambda p: p["value"].update(normalized=12))
invalid_case("confidence-out-of-range", "Fact", lambda p: p.update(confidence=1.5))
invalid_case("missing-evidence", "Fact", lambda p: p.update(evidence_ids=[]))
invalid_case("invented-label", "Relationship", lambda p: p.update(type="TRUE"))
invalid_case("zero-page", "Evidence", lambda p: p["provenance"][0].update(physical_page=0))
invalid_case("path-traversal", "ProcessRequest", lambda p: p.update(storage_key="../secret.pdf"))
invalid_case("absolute-path", "ProcessRequest", lambda p: p.update(storage_key="C:/secret.pdf"))
invalid_case("bad-version", "ProcessRequest", lambda p: p.update(contract_version="2.0"))
invalid_case("empty-pairs", "ReasonRequest", lambda p: p.update(pairs=[]))
invalid_case("bad-uuid", "Document", lambda p: p.update(id="not-an-id"))
for label in ["CONTRADICTED", "RECONCILED", "UNCERTAIN"]:
    payload = deepcopy(relationship)
    payload["type"] = label
    payload["explanation"] = "Label validation fixture only; not a measured reasoning result."
    fixtures.append(dict(name=f"label-{label}", contract="Relationship", valid=True, payload=payload))
path = Path(__file__).resolve().parents[1] / "shared/contract-fixtures/cases.json"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(fixtures, indent=2) + "\n", encoding="utf-8", newline="\n")
print(f"Wrote {len(fixtures)} contract cases")
