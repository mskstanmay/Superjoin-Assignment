"""Generate a tiny authored test PDF, not assignment evidence. No dependencies."""
from pathlib import Path

stream = b"BT /F1 18 Tf 72 720 Td (Provenance smoke test) Tj 0 -30 Td /F1 12 Tf (A small document for local conversion validation.) Tj ET"
objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
]
data = bytearray(b"%PDF-1.4\n")
offsets = [0]
for index, obj in enumerate(objects, 1):
    offsets.append(len(data))
    data.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
xref = len(data)
data.extend(f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode())
for offset in offsets[1:]:
    data.extend(f"{offset:010d} 00000 n \n".encode())
data.extend(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
path = Path(__file__).resolve().parents[1] / "tests/fixtures/tiny.pdf"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_bytes(data)
print(f"Wrote authored fixture: {len(data)} bytes")
