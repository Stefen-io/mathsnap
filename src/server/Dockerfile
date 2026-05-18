FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first (layer cache: only re-install when dependencies change)
COPY pyproject.toml uv.lock ./

# Install dependencies from lockfile, remove dev dependencies
RUN uv sync --frozen --no-dev

# Copy source code
COPY . .

CMD uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
