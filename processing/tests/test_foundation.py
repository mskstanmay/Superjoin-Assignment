import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator, FormatChecker
from pydantic import ValidationError

from app.config import Settings, assert_no_database_credentials
from app.contracts import CONTRACTS, ApiError, Health
from app.main import create_app

ROOT = Path(__file__).resolve().parents[2]
CASES = json.loads((ROOT / "shared/contract-fixtures/cases.json").read_text())


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["name"])
def test_shared_contracts(case):
    model = CONTRACTS[case["contract"]]
    schema = json.loads((ROOT / f"shared/contracts/{case['contract']}.json").read_text())
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    assert validator.is_valid(case["payload"]) == case["valid"]
    if case["valid"]:
        model.model_validate_json(json.dumps(case["payload"]))
    else:
        with pytest.raises(ValidationError):
            model.model_validate_json(json.dumps(case["payload"]))


def test_missing_configuration(monkeypatch):
    for key in ["UPLOAD_ROOT", "ARTIFACT_ROOT", "MODEL_CACHE_DIR"]:
        monkeypatch.delenv(key, raising=False)
    with pytest.raises(ValidationError, match="upload_root"):
        Settings()


def test_example_processing_configuration():
    from dotenv import dotenv_values
    # Allowlist only processing-owned settings. Never load DB values into env.
    example = dotenv_values(ROOT / ".env.example")
    values = {key.lower(): value for key, value in example.items() if key.lower() in Settings.model_fields}
    settings = Settings(**values)
    assert settings.live_llm_enabled is False
    with pytest.raises(ValidationError, match="Live LLM"):
        Settings(**{**values, "live_llm_enabled": True})


@pytest.mark.parametrize("key", ["DATABASE_URL", "PGPASSWORD", "POSTGRES_PASSWORD", "PGUSER"])
def test_database_environment_is_rejected(key):
    with pytest.raises(ValueError, match="must not receive"):
        assert_no_database_credentials({key: "do-not-print-this-value"})


def test_health_and_contract_endpoints(tmp_path):
    client = TestClient(create_app(Settings(upload_root=tmp_path, artifact_root=tmp_path, model_cache_dir=tmp_path)))
    response = client.get("/health")
    assert response.status_code == 200
    Health.model_validate_json(response.content)
    for route, contract in [("/process", "ProcessRequest"), ("/reason", "ReasonRequest")]:
        payload = next(c["payload"] for c in CASES if c["name"] == f"valid-{contract}")
        response = client.post(route, json=payload)
        assert response.status_code == 501
        parsed = ApiError.model_validate_json(response.content)
        assert parsed.error.code == "STAGE_NOT_IMPLEMENTED"
        assert parsed.error.retryable is False
        assert str(parsed.error.request_id) == payload["request_id"]
        assert response.headers["x-request-id"] == payload["request_id"]
        assert client.post(route, json={}).status_code == 422
        malformed = client.post(route, content='{"secret":"DO_NOT_ECHO",')
        assert malformed.status_code == 422
        assert "DO_NOT_ECHO" not in malformed.text
    ApiError.model_validate_json(client.get("/missing").content)
    schema = client.get("/openapi.json").json()
    def check_refs(value):
        if isinstance(value, dict):
            if "$ref" in value:
                node = schema
                for part in value["$ref"].removeprefix("#/").split("/"):
                    node = node[part]
            for child in value.values():
                check_refs(child)
        elif isinstance(value, list):
            for child in value:
                check_refs(child)
    check_refs(schema)


def test_request_size_limit(tmp_path):
    client = TestClient(create_app(Settings(upload_root=tmp_path, artifact_root=tmp_path,
                                          model_cache_dir=tmp_path, max_request_bytes=1024)))
    assert client.post("/process", content="x" * 1025).status_code == 413


def test_compose_keeps_database_private():
    import yaml
    compose = yaml.safe_load((ROOT / "compose.yaml").read_text())
    processing = compose["services"]["processing"]
    assert "env_file" not in processing
    assert "ports" not in processing
    assert_no_database_credentials(processing["environment"])
    assert "DATABASE_URL" in compose["services"]["backend"]["environment"]
    assert "ports" not in compose["services"]["postgres"]


@pytest.mark.docling
def test_real_docling_smoke(tmp_path, monkeypatch):
    from app.docling_adapter.smoke import convert_smoke
    import os
    monkeypatch.setenv("HF_HOME", os.environ.get("HF_HOME", str(ROOT / ".runtime/model-cache")))
    report = convert_smoke(ROOT / "tests/fixtures/tiny.pdf", tmp_path)
    assert report["pages"] == 1
    assert report["blocks"] >= 1
    assert report["physical_pages"] == [1]
    assert report["llm_calls"] == 0
