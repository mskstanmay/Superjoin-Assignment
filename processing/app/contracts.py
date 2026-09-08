"""Wire contract v1. Exported JSON Schemas are the language-neutral interface.

These are service-owned DTOs, never a schema granting an LLM authority to invent
provenance. Cross-record grounding is an additional ingestion responsibility.
"""

from datetime import datetime, date
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, JsonValue, StringConstraints

Text = Annotated[str, StringConstraints(min_length=1)]
DecimalText = Annotated[str, StringConstraints(pattern=r"^-?(0|[1-9][0-9]*)(\.[0-9]+)?$")]
StorageKey = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]+$")]
Hash = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
Confidence = Annotated[float, Field(ge=0, le=1)]
Stage = Literal["document_understanding", "extraction", "normalization", "matching", "reasoning"]
Status = Literal["uploaded", "queued", "processing", "retry_wait", "completed", "partially_completed", "failed"]
Label = Literal["CORROBORATED", "CONTRADICTED", "RECONCILED", "UNCERTAIN"]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class Versions(Contract):
    pipeline: Text
    schema_version: Literal["1.0"]
    conversion: Text
    chunking: Text
    normalization: Text
    model: str | None
    prompt: str | None


class Counts(Contract):
    pages_processed: int = Field(ge=0)
    pages_total: int | None = Field(ge=1)
    chunks_processed: int = Field(ge=0)
    facts_accepted: int = Field(ge=0)
    facts_rejected: int = Field(ge=0)
    comparisons_completed: int = Field(ge=0)
    comparisons_failed: int = Field(ge=0)


class ProcessingStatus(Contract):
    status: Status
    stage: Stage | None
    counts: Counts


class Document(Contract):
    id: UUID
    original_filename: Text
    sha256: Hash
    storage_key: StorageKey
    content_type: Literal["application/pdf"]
    size_bytes: int = Field(gt=0)
    page_count: int | None = Field(ge=1)
    metadata: dict[str, JsonValue]
    processing: ProcessingStatus
    active_run_id: UUID | None
    created_at: datetime
    updated_at: datetime


class ProcessingJob(Contract):
    id: UUID
    document_id: UUID
    processing: ProcessingStatus
    attempt: int = Field(ge=0)
    heartbeat_at: datetime | None
    next_attempt_at: datetime | None
    lease_token: UUID | None
    versions: Versions
    checkpoint: dict[str, JsonValue]
    started_at: datetime | None
    ended_at: datetime | None


class BoundingBox(Contract):
    left: float
    top: float
    right: float
    bottom: float
    coordinate_origin: Literal["TOPLEFT", "BOTTOMLEFT"]
    page_width: float = Field(gt=0)
    page_height: float = Field(gt=0)


class Provenance(Contract):
    physical_page: int = Field(ge=1)
    printed_labels: list[str]
    original_page: int | None = Field(ge=1)
    bbox: BoundingBox | None


class DocumentBlock(Contract):
    id: UUID
    document_id: UUID
    run_id: UUID
    local_ref: Text
    label: Text
    original_text: str
    structure: dict[str, JsonValue]
    parent_block_id: UUID | None
    section: list[str]
    reading_order: int = Field(ge=0)
    provenance: list[Provenance] = Field(min_length=1)


class DocumentChunk(Contract):
    id: UUID
    run_id: UUID
    chunk_index: int = Field(ge=0)
    block_ids: list[UUID] = Field(min_length=1)
    contextualized_text: str
    token_count: int = Field(ge=0)
    chunk_policy_version: Text


class SpanSelector(Contract):
    kind: Literal["span"]
    start: int = Field(ge=0)
    end: int = Field(gt=0)


class CellSelector(Contract):
    kind: Literal["cell"]
    row: int = Field(ge=0)
    column: int = Field(ge=0)


class BlockSelector(Contract):
    kind: Literal["block"]


Selector = Annotated[SpanSelector | CellSelector | BlockSelector, Field(discriminator="kind")]


class Evidence(Contract):
    id: UUID
    fact_id: UUID
    document_id: UUID
    run_id: UUID
    block_id: UUID
    role: Literal["assertion", "value", "subject", "row_header", "column_header", "unit", "time", "footnote", "qualifier"]
    selector: Selector
    quote: Text
    provenance: list[Provenance] = Field(min_length=1)
    validation_status: Literal["validated", "rejected", "pending"]


class ValueBase(Contract):
    original_text: Text
    unit: str | None
    currency: str | None
    scale: DecimalText | None
    approximate: bool
    precision: int | None = Field(ge=0)
    normalization_status: Literal["normalized", "unchanged", "ambiguous", "unsupported"]
    rule_version: Text


class NumberValue(ValueBase):
    kind: Literal["number"]
    normalized: DecimalText | None
    comparator: Literal["eq", "gt", "gte", "lt", "lte"]


class RangeValue(ValueBase):
    kind: Literal["range"]
    lower: DecimalText | None
    upper: DecimalText | None
    lower_inclusive: bool
    upper_inclusive: bool


class SemanticValue(ValueBase):
    kind: Literal["text", "entity", "other"]
    normalized: str | None
    attributes: dict[str, JsonValue]


class BooleanValue(ValueBase):
    kind: Literal["boolean"]
    normalized: bool | None


class DateValue(ValueBase):
    kind: Literal["date"]
    normalized: date | None


Value = Annotated[NumberValue | RangeValue | SemanticValue | BooleanValue | DateValue, Field(discriminator="kind")]


class TimeContext(Contract):
    original_label: str | None
    kind: Literal["instant", "interval", "fiscal_year", "quarter", "half_year", "unspecified"]
    start: date | None
    end: date | None
    calendar_basis: str | None
    year_label_convention: str | None
    resolution_status: Literal["resolved", "ambiguous", "unspecified"]
    publication_date: date | None
    as_of_date: date | None
    effective_date: date | None


class Qualifier(Contract):
    value: JsonValue
    evidence_ids: list[UUID]


class Fact(Contract):
    id: UUID
    document_id: UUID
    run_id: UUID
    candidate_key: Text
    assertion_text: Text
    subject_original: Text
    subject_entity_id: UUID | None
    predicate_original: Text
    predicate_id: UUID | None
    value: Value
    time: TimeContext
    qualifiers: dict[str, Qualifier]
    polarity: Literal["positive", "negative", "unknown"]
    modality: Literal["asserted", "historical", "estimate", "forecast", "target", "conditional", "unknown"]
    confidence: Confidence | None
    uncertainty: list[str]
    quality_state: Literal["accepted", "review_needed", "quarantined"]
    evidence_ids: list[UUID] = Field(min_length=1)


class DimensionComparison(Contract):
    dimension: Text
    fact_a: JsonValue
    fact_b: JsonValue
    outcome: Literal["aligned", "different", "unknown", "not_applicable"]
    explanation: Text
    evidence_ids: list[UUID]


class Relationship(Contract):
    id: UUID
    fact_a_id: UUID
    fact_b_id: UUID
    type: Label
    explanation: Text
    dimensions: list[DimensionComparison] = Field(min_length=1)
    confidence: Confidence | None
    confidence_source: Literal["model", "rule"]
    unresolved_context: list[str]
    supporting_evidence_ids: list[UUID]
    reasoning_run_id: UUID
    reasoning_version: Text
    model_version: str | None
    prompt_version: str | None
    input_hash: Hash


class ProcessingIssue(Contract):
    id: UUID
    run_id: UUID
    stage: Stage
    code: Text
    affected_ids: list[UUID]
    severity: Literal["info", "warning", "error"]
    observed_problem: Text
    action_taken: Text
    retryable: bool
    resolution: str | None
    artifact_key: StorageKey | None
    created_at: datetime


class ApiErrorDetail(Contract):
    code: Text
    message: Text
    request_id: UUID
    retryable: bool


class ApiError(Contract):
    error: ApiErrorDetail


class ProcessingLimits(Contract):
    max_pages: int = Field(ge=1, le=10000)
    max_bytes: int = Field(ge=1)
    timeout_seconds: int = Field(ge=1, le=3600)
    chunk_token_budget: int = Field(ge=128)


class ProcessRequest(Contract):
    contract_version: Literal["1.0"]
    request_id: UUID
    document_id: UUID
    run_id: UUID
    lease_token: UUID
    storage_key: StorageKey
    sha256: Hash
    versions: Versions
    limits: ProcessingLimits


class Artifact(Contract):
    kind: Literal["docling", "blocks", "chunks", "candidates", "diagnostics"]
    storage_key: StorageKey
    sha256: Hash
    size_bytes: int = Field(ge=0)
    schema_version: Text


class ProcessResponse(Contract):
    contract_version: Literal["1.0"]
    request_id: UUID
    document_id: UUID
    run_id: UUID
    lease_token: UUID
    status: Literal["completed", "partially_completed", "failed"]
    artifacts: list[Artifact]
    counts: Counts
    issues: list[ProcessingIssue]


class ReasonPair(Contract):
    fact_a: Fact
    fact_b: Fact
    evidence: list[Evidence] = Field(min_length=2)


class ReasonRequest(Contract):
    contract_version: Literal["1.0"]
    request_id: UUID
    run_id: UUID
    reasoning_version: Text
    pairs: list[ReasonPair] = Field(min_length=1, max_length=20)


class ReasonResponse(Contract):
    contract_version: Literal["1.0"]
    request_id: UUID
    run_id: UUID
    relationships: list[Relationship]
    issues: list[ProcessingIssue]


class Health(Contract):
    service: Literal["backend", "processing"]
    status: Literal["ok", "degraded"]
    contract_version: Literal["1.0"]
    checks: dict[str, Literal["ok", "unavailable", "not_configured", "not_implemented"]]


CONTRACTS = {model.__name__: model for model in (
    Document, ProcessingStatus, ProcessingJob, DocumentBlock, DocumentChunk,
    Fact, Evidence, Relationship, ProcessingIssue, ProcessRequest, ProcessResponse,
    ReasonRequest, ReasonResponse, ApiError, Health,
)}
