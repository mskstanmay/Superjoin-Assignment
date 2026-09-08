from pathlib import Path
from collections.abc import Mapping
import os
from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DATABASE_KEYS = {"DATABASE_URL", "POSTGRES_PASSWORD", "POSTGRES_USER", "PGPASSWORD", "PGUSER", "PGHOST", "PGDATABASE", "PGSERVICE", "PGPASSFILE"}


def assert_no_database_credentials(env: Mapping[str, str]) -> None:
    if any(value and (key.upper() in DATABASE_KEYS or key.upper().startswith(("DATABASE_", "POSTGRES_")))
           for key, value in env.items()):
        raise ValueError("Processing service must not receive PostgreSQL configuration or credentials")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)
    upload_root: Path
    artifact_root: Path
    model_cache_dir: Path
    llm_provider: str = ""
    llm_model: str = ""
    llm_api_key: SecretStr = SecretStr("")
    live_llm_enabled: bool = False
    llm_concurrency: int = Field(default=2, ge=1, le=16)
    llm_max_output_tokens: int = Field(default=1200, ge=128, le=4096)
    conversion_concurrency: int = Field(default=1, ge=1, le=4)
    docling_do_ocr: bool = False
    docling_do_table_structure: bool = True
    max_pdf_pages: int = Field(default=100, ge=1, le=10000)
    max_upload_bytes: int = Field(default=20_000_000, ge=1)
    processing_timeout_seconds: int = Field(default=300, ge=1, le=3600)
    chunk_token_budget: int = Field(default=2048, ge=128)
    max_request_bytes: int = Field(default=2_000_000, ge=1024)
    log_level: str = "info"

    @model_validator(mode="after")
    def validate_live_config(self):
        if self.live_llm_enabled and not (self.llm_provider and self.llm_model and self.llm_api_key.get_secret_value()):
            raise ValueError("Live LLM mode requires provider, model, and API key")
        if self.live_llm_enabled and self.llm_provider.lower() != "gemini":
            raise ValueError("Only the Gemini provider is implemented")
        return self


def load_settings() -> Settings:
    # Deliberately does not read the root .env, which includes Node DB credentials.
    assert_no_database_credentials(os.environ)
    return Settings()
