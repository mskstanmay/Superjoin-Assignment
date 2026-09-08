FROM ghcr.io/astral-sh/uv:0.12.10 AS uv
FROM python:3.12.14-slim-bookworm
COPY --from=uv /uv /usr/local/bin/uv
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app/processing
COPY processing/pyproject.toml processing/uv.lock ./
ENV UV_LINK_MODE=copy
RUN uv sync --frozen
COPY processing/app app
COPY processing/tests tests
COPY shared /app/shared
COPY tests/fixtures /app/tests/fixtures
COPY .env.example compose.yaml /app/
ENV PATH="/app/processing/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
