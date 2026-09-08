import hashlib
import json
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import UUID, uuid5

from app.contracts import DocumentBlock, DocumentChunk, Evidence, Fact, NumberValue, SemanticValue, TimeContext


def _number(value: str, unit: str | None) -> dict:
    cleaned = value.replace(",", "").replace("₹", "").strip()
    try:
        amount = Decimal(cleaned)
    except InvalidOperation:
        return SemanticValue(original_text=value, unit=unit, currency="INR" if "₹" in value else None,
                             scale=None, approximate=False, precision=None, normalization_status="unsupported",
                             rule_version="mvp-1", kind="text", normalized=value, attributes={}).model_dump(mode="json")
    scale = Decimal("1")
    normalized_unit = unit
    if unit and unit.lower() in {"crore", "crores"}:
        scale = Decimal("10000000")
        normalized_unit = "INR"
    elif unit and unit.lower() in {"million", "mn"}:
        scale = Decimal("1000000")
        normalized_unit = "INR"
    elif unit and unit.lower() in {"billion", "bn"}:
        scale = Decimal("1000000000")
        normalized_unit = "INR"
    normalized = format(amount * scale, "f").rstrip("0").rstrip(".") or "0"
    return NumberValue(original_text=value, unit=unit, currency="INR" if "₹" in value else None,
                       scale=str(scale), approximate=False, precision=max(0, -amount.as_tuple().exponent),
                       normalization_status="normalized" if scale != 1 else "unchanged", rule_version="mvp-1",
                       kind="number", normalized=normalized, comparator="eq").model_dump(mode="json")


def _fact_from_text(document_id: UUID, run_id: UUID, block: DocumentBlock, evidence_id: UUID) -> Fact | None:
    text = block.original_text
    match = re.search(r"(?P<label>[A-Za-z][A-Za-z &/'-]{2,60}?)\s*(?:is|was|were|:|amounted to|stood at)\s*(?P<value>₹?[\d,]+(?:\.\d+)?)\s*(?P<unit>crore|crores|million|mn|billion|bn|%)?", text, re.I)
    if not match:
        return None
    label = re.sub(r"\s+", " ", match.group("label")).strip(" .:-")
    original_value = match.group("value")
    value = _number(original_value, match.group("unit"))
    fact_id = uuid5(run_id, f"fact:{block.id}:{match.start()}")
    return Fact(id=fact_id, document_id=document_id, run_id=run_id, candidate_key=f"{block.id}:{match.start()}",
                assertion_text=text[:500], subject_original=label, subject_entity_id=None,
                predicate_original="reported value", predicate_id=None, value=value,
                time=TimeContext(original_label=None, kind="unspecified", start=None, end=None, calendar_basis=None,
                                 year_label_convention=None, resolution_status="unspecified", publication_date=None,
                                 as_of_date=None, effective_date=None), qualifiers={}, polarity="positive",
                modality="asserted", confidence=0.45, uncertainty=["Fallback extraction used; configure an LLM for semantic extraction."],
                quality_state="review_needed", evidence_ids=[evidence_id])


def convert_pdf(pdf: Path, document_id: UUID, run_id: UUID, settings) -> dict:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import AcceleratorDevice, AcceleratorOptions, PdfPipelineOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption

    options = PdfPipelineOptions(do_ocr=settings.docling_do_ocr,
                                 do_table_structure=settings.docling_do_table_structure,
                                 document_timeout=settings.processing_timeout_seconds,
                                 accelerator_options=AcceleratorOptions(num_threads=2, device=AcceleratorDevice.CPU))
    converter = DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})
    result = converter.convert(pdf, max_num_pages=settings.max_pdf_pages, max_file_size=settings.max_upload_bytes)
    if str(result.status.value) != "success":
        raise RuntimeError(f"Docling conversion failed: {result.status}")
    document = result.document
    blocks: list[DocumentBlock] = []
    fallback_facts: list[Fact] = []
    for item, _level in document.iterate_items():
        text = getattr(item, "text", "") or ""
        if not text or not item.prov:
            continue
        provenance = []
        for loc in item.prov:
            page = document.pages.get(loc.page_no)
            if page is None or loc.page_no < 1:
                continue
            provenance.append({"physical_page": loc.page_no, "printed_labels": [], "original_page": None,
                               "bbox": {"left": loc.bbox.l, "top": loc.bbox.t, "right": loc.bbox.r, "bottom": loc.bbox.b,
                                        "coordinate_origin": loc.bbox.coord_origin.value, "page_width": page.size.width,
                                        "page_height": page.size.height}})
        if not provenance:
            continue
        block = DocumentBlock(id=uuid5(run_id, item.self_ref), document_id=document_id, run_id=run_id,
                              local_ref=item.self_ref, label=item.label.value, original_text=text, structure={},
                              parent_block_id=None, section=[], reading_order=len(blocks), provenance=provenance)
        blocks.append(block)
        evidence_id = uuid5(run_id, f"evidence:{block.id}")
        fact = _fact_from_text(document_id, run_id, block, evidence_id)
        if fact:
            fallback_facts.append(fact)
    chunks = []
    for index in range(0, len(blocks), 8):
        group = blocks[index:index + 8]
        chunks.append(DocumentChunk(id=uuid5(run_id, f"chunk:{index}"), run_id=run_id, chunk_index=index // 8,
                                    block_ids=[block.id for block in group],
                                    contextualized_text="\n".join(block.original_text for block in group),
                                    token_count=sum(len(block.original_text.split()) for block in group),
                                    chunk_policy_version="mvp-1"))
    facts = fallback_facts
    if settings.live_llm_enabled and settings.llm_provider.lower() == "gemini":
        from app.gemini import extract_facts
        facts = extract_facts([chunk.model_dump(mode="json") for chunk in chunks], blocks, document_id, run_id, settings)
    block_by_evidence = {uuid5(run_id, f"evidence:{block.id}"): block for block in blocks}
    evidence = [Evidence(id=evidence_id, fact_id=fact.id, document_id=document_id, run_id=run_id,
                         block_id=block_by_evidence[evidence_id].id, role="assertion", selector={"kind": "block"},
                         quote=block_by_evidence[evidence_id].original_text,
                         provenance=block_by_evidence[evidence_id].provenance, validation_status="validated")
                for fact in facts for evidence_id in fact.evidence_ids]
    manifest = {"blocks": [block.model_dump(mode="json") for block in blocks],
                "chunks": [chunk.model_dump(mode="json") for chunk in chunks],
                "facts": [fact.model_dump(mode="json") for fact in facts],
                "evidence": [item.model_dump(mode="json") for item in evidence], "pages": len(document.pages)}
    return manifest


def manifest_hash(manifest: dict) -> str:
    return hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()