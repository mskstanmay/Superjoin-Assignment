import json
import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from pydantic import ValidationError
from starlette.exceptions import HTTPException

from app.config import Settings, load_settings
from app.contracts import ApiError, Counts, Health, ProcessRequest, ProcessResponse, ReasonRequest
from app.pipeline import convert_pdf, manifest_hash


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    app = FastAPI(title="Superjoin processing", version="0.1.0")
    request_definitions = {}

    def request_schema(model):
        schema = model.model_json_schema(ref_template="#/components/schemas/{model}")
        request_definitions.update(schema.pop("$defs", {}))
        return schema

    def error(request: Request, status: int, code: str, message: str):
        payload = {"error": {"code": code, "message": message,
                             "request_id": request.state.request_id, "retryable": status >= 500 and status != 501}}
        ApiError.model_validate_json(json.dumps(payload))
        return JSONResponse(status_code=status, content=payload)

    @app.middleware("http")
    async def identify(request: Request, call_next):
        request.state.request_id = str(uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        return error(request, exc.status_code, "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR", "Request could not be handled.")

    @app.exception_handler(Exception)
    async def unexpected(request: Request, _exc: Exception):
        logging.error("Processing request failed; request_id=%s", request.state.request_id)
        return error(request, 500, "INTERNAL_ERROR", "Processing request could not be completed.")

    @app.get("/health", response_model=Health)
    def health():
        return Health(service="processing", status="ok", contract_version="1.0", checks={
            "contracts": "ok", "pipeline": "ok",
            "llm": "ok" if settings.live_llm_enabled and settings.llm_provider.lower() == "gemini" else "not_configured",
        })

    async def validate_request(request: Request, model):
        data = bytearray()
        async for chunk in request.stream():
            data.extend(chunk)
            if len(data) > settings.max_request_bytes:
                return None, error(request, 413, "REQUEST_TOO_LARGE", "Internal request exceeds configured limit.")
        try:
            payload = model.model_validate_json(bytes(data))
        except ValidationError:
            return None, error(request, 422, "INVALID_REQUEST", "Request does not match contract version 1.0.")
        request.state.request_id = str(payload.request_id)
        return payload, None

    @app.post("/process", responses={501: {"model": ApiError}}, openapi_extra={
        "requestBody": {"required": True, "content": {"application/json": {"schema": request_schema(ProcessRequest)}}}
    })
    async def process(request: Request):
        payload, failure = await validate_request(request, ProcessRequest)
        if failure is not None:
            return failure
        if (payload.limits.max_pages > settings.max_pdf_pages
                or payload.limits.max_bytes > settings.max_upload_bytes
                or payload.limits.timeout_seconds > settings.processing_timeout_seconds
                or payload.limits.chunk_token_budget > settings.chunk_token_budget):
            return error(request, 422, "LIMIT_EXCEEDED", "Requested processing limits exceed service configuration.")
        try:
            source = settings.upload_root / payload.storage_key
            if not source.is_file():
                return error(request, 501, "STAGE_NOT_IMPLEMENTED", "The referenced uploaded PDF is not available; no job was executed.")
            manifest = convert_pdf(settings.upload_root / payload.storage_key, payload.document_id, payload.run_id, settings)
            artifact_key = f"runs/{payload.run_id}.json"
            target = settings.artifact_root / artifact_key
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(manifest), encoding="utf-8")
            response = ProcessResponse(contract_version="1.0", request_id=payload.request_id,
                document_id=payload.document_id, run_id=payload.run_id, lease_token=payload.lease_token,
                status="completed" if manifest["blocks"] else "partially_completed", artifacts=[{
                    "kind": "blocks", "storage_key": artifact_key, "sha256": manifest_hash(manifest),
                    "size_bytes": target.stat().st_size, "schema_version": "1.0"}],
                counts=Counts(pages_processed=manifest["pages"], pages_total=manifest["pages"],
                    chunks_processed=len(manifest["chunks"]), facts_accepted=len(manifest["facts"]), facts_rejected=0,
                    comparisons_completed=0, comparisons_failed=0), issues=[])
            return response.model_dump(mode="json")
        except Exception as exc:
            logging.exception("Processing failed; request_id=%s", request.state.request_id)
            return error(request, 500, "PROCESSING_FAILED", str(exc)[:200])

    @app.post("/reason", responses={501: {"model": ApiError}}, openapi_extra={
        "requestBody": {"required": True, "content": {"application/json": {"schema": request_schema(ReasonRequest)}}}
    })
    async def reason(request: Request):
        _payload, failure = await validate_request(request, ReasonRequest)
        if failure is not None:
            return failure
        return error(request, 501, "STAGE_NOT_IMPLEMENTED", "Relationship reasoning is not implemented; no model was called.")

    def openapi():
        if app.openapi_schema is None:
            schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
            schema.setdefault("components", {}).setdefault("schemas", {}).update(request_definitions)
            app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = openapi
    return app
