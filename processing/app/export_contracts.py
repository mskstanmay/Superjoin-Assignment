"""Run from processing: python -m app.export_contracts [--check]."""
import argparse
import json
from pathlib import Path
from app.contracts import CONTRACTS


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2] / "shared" / "contracts"
    root.mkdir(parents=True, exist_ok=True)
    for name, model in CONTRACTS.items():
        schema = model.model_json_schema()
        schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
        content = json.dumps(schema, indent=2, ensure_ascii=False) + "\n"
        path = root / f"{name}.json"
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"Contract drift: regenerate {name}")
        else:
            path.write_text(content, encoding="utf-8", newline="\n")
    print(f"{len(CONTRACTS)} contracts {'checked' if args.check else 'exported'}")


if __name__ == "__main__":
    main()
