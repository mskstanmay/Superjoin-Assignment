"""Real StandardPdfPipeline conversion of a tiny text PDF. No LLM call."""
import argparse
import json
import os
import time
from importlib.metadata import version
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from app.contracts import DocumentBlock


def convert_smoke(pdf: Path, output: Path) -> dict:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions, AcceleratorOptions, AcceleratorDevice
    from docling.document_converter import DocumentConverter, PdfFormatOption

    start = time.monotonic()
    options = PdfPipelineOptions(
        do_ocr=False, do_table_structure=False, document_timeout=180,
        accelerator_options=AcceleratorOptions(num_threads=2, device=AcceleratorDevice.CPU),
    )
    converter = DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})
    result = converter.convert(pdf, max_num_pages=2, max_file_size=100_000)
    if str(result.status.value) != "success":
        raise RuntimeError(f"Docling conversion did not succeed: {result.status}")
    document = result.document
    structured = document.export_to_dict()
    if not document.pages:
        raise AssertionError("Docling emitted no page metadata")
    document_id = uuid5(NAMESPACE_URL, "superjoin:authored-smoke:document")
    run_id = uuid5(NAMESPACE_URL, "superjoin:authored-smoke:run")
    blocks = []
    for item, _level in document.iterate_items():
        text = getattr(item, "text", "")
        if not text or not item.prov:
            continue
        provenance = []
        for loc in item.prov:
            if loc.page_no not in document.pages or loc.page_no < 1:
                raise AssertionError("Invalid physical page locator")
            page = document.pages[loc.page_no]
            provenance.append({
                "physical_page": loc.page_no, "printed_labels": [], "original_page": None,
                "bbox": {"left": loc.bbox.l, "top": loc.bbox.t, "right": loc.bbox.r,
                         "bottom": loc.bbox.b, "coordinate_origin": loc.bbox.coord_origin.value,
                         "page_width": page.size.width, "page_height": page.size.height},
            })
        block = DocumentBlock.model_validate_json(json.dumps({
            "id": str(uuid5(run_id, item.self_ref)), "document_id": str(document_id), "run_id": str(run_id),
            "local_ref": item.self_ref, "label": item.label.value, "original_text": text,
            "structure": {}, "parent_block_id": None, "section": [], "reading_order": len(blocks),
            "provenance": provenance,
        }))
        blocks.append(block.model_dump(mode="json"))
    if not blocks or not any("Provenance smoke test" in block["original_text"] for block in blocks):
        raise AssertionError("Expected authored fixture text and block evidence are absent")
    output.mkdir(parents=True, exist_ok=True)
    (output / "docling.json").write_text(json.dumps(structured, indent=2), encoding="utf-8")
    (output / "blocks.json").write_text(json.dumps(blocks, indent=2), encoding="utf-8")
    report = {
        "docling_version": version("docling"), "pipeline": "StandardPdfPipeline",
        "ocr": False, "table_structure": False, "pages": len(document.pages), "blocks": len(blocks),
        "physical_pages": sorted({p["physical_page"] for b in blocks for p in b["provenance"]}),
        "elapsed_seconds": round(time.monotonic() - start, 3), "llm_calls": 0,
    }
    (output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main():
    root = Path(__file__).resolve().parents[3]
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=root / "tests/fixtures/tiny.pdf")
    parser.add_argument("--output", type=Path, default=root / ".runtime/docling-smoke")
    args = parser.parse_args()
    os.environ.setdefault("HF_HOME", str(root / ".runtime/model-cache"))
    print(json.dumps(convert_smoke(args.pdf, args.output), indent=2))


if __name__ == "__main__":
    main()
