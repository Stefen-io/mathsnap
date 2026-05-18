## ADDED Requirements

### Requirement: FastAPI Application Entry Point

The backend SHALL provide a FastAPI application defined in `src/server/app/main.py` that initializes with CORS middleware and an eager-loaded pix2tex model via the lifespan context manager.

#### Scenario: Application starts successfully

- **WHEN** the Docker container starts and `uvicorn app.main:app` is invoked
- **THEN** the app loads the pix2tex LatexOCR model during startup and sets a `model_ready` flag to True before accepting traffic

---

### Requirement: Health Endpoint Readiness Guard

The backend SHALL expose `GET /health` that returns HTTP 200 with `{"status": "ok"}` only when the pix2tex model has finished loading, and HTTP 503 with `{"detail": "model loading"}` during startup.

#### Scenario: Health check before model is ready

- **WHEN** `GET /health` is called before the lifespan startup completes
- **THEN** the endpoint returns HTTP 503 with body `{"detail": "model loading"}`

#### Scenario: Health check after model is ready

- **WHEN** `GET /health` is called after lifespan startup completes successfully
- **THEN** the endpoint returns HTTP 200 with body `{"status": "ok"}`

---

### Requirement: CORS Middleware for Allowed Origins

The backend SHALL apply CORSMiddleware that allows requests from all origins listed in the `ALLOWED_ORIGINS` environment variable (comma-separated string, defaulting to `http://localhost:3000` for local development), with allowed methods `GET, POST, PATCH, DELETE` and allowed headers `Content-Type, X-Device-ID`.

#### Scenario: Request from allowed Vercel origin

- **WHEN** the frontend at `https://mathsnap-xi.vercel.app` sends a cross-origin `fetch()` to `/health`
- **THEN** the response includes `Access-Control-Allow-Origin: https://mathsnap-xi.vercel.app` and the fetch succeeds without CORS error

#### Scenario: Request from disallowed origin

- **WHEN** a cross-origin request arrives from an origin not in `ALLOWED_ORIGINS`
- **THEN** the browser receives no `Access-Control-Allow-Origin` header and the request is blocked by the browser's CORS policy

#### Scenario: Local development without .env

- **WHEN** `ALLOWED_ORIGINS` env var is not set
- **THEN** CORS defaults to allowing `http://localhost:3000`

#### Scenario: Multiple origins configured

- **WHEN** `ALLOWED_ORIGINS=https://mathsnap-xi.vercel.app,https://staging.example.com`
- **THEN** both origins receive the correct `Access-Control-Allow-Origin` header

---

### Requirement: Dependency Specification

The backend SHALL declare all runtime dependencies in `src/server/requirements.txt` with pinned versions as specified in SYSTEM_DESIGN 2.2: fastapi==0.111.0, uvicorn==0.30.0, pix2tex==0.1.2, langchain-openai==0.1.20, langchain-core==0.2.40, supabase==2.4.0, pydantic>=2.0, python-multipart==0.0.9. Additionally, `albumentations<2.0.0` is pinned to resolve a pix2tex 0.1.2 incompatibility with albumentations 2.x.

#### Scenario: Fresh pip install succeeds

- **WHEN** `pip install -r requirements.txt` is run in a clean Python 3.11 environment
- **THEN** all packages install without version conflicts and `import fastapi, pix2tex` succeeds

---

### Requirement: Dockerfile Layer Cache Optimization

The backend SHALL include a `Dockerfile` that copies `requirements.txt` and runs `pip install` as a separate layer before copying application source, so that source-only changes do not invalidate the pip install layer.

#### Scenario: Source change does not rebuild pip layer

- **WHEN** only `main.py` is modified and `docker build` is run
- **THEN** the `RUN pip install` step is served from Docker cache (no re-download of packages)

#### Scenario: Requirements change invalidates pip layer

- **WHEN** `requirements.txt` is modified and `docker build` is run
- **THEN** the `RUN pip install` step executes fresh to install updated dependencies

---

### Requirement: Dynamic Port Binding

The backend SHALL bind to the port provided by the `PORT` environment variable (defaulting to 8000), as Railway injects this variable dynamically at runtime.

#### Scenario: Railway deployment uses injected PORT

- **WHEN** Railway starts the container with `PORT=12345` in the environment
- **THEN** uvicorn listens on port 12345 and Railway's reverse proxy can reach the app

#### Scenario: Local run without PORT env var

- **WHEN** the container is started locally without setting `PORT`
- **THEN** uvicorn listens on the default port 8000

---

### Requirement: Environment Variable Documentation

The backend SHALL include `src/server/.env.example` documenting all required environment variables: `ALLOWED_ORIGINS` (comma-separated, replaces single-origin `ALLOWED_ORIGINS`), `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`.

#### Scenario: Developer onboarding

- **WHEN** a developer copies `.env.example` to `.env` and fills in values
- **THEN** the application starts locally with correct configuration without guessing required variables

---

### Requirement: OpenAPI / Swagger Documentation

The backend SHALL configure the FastAPI application with metadata (`title`, `description`, `version`) and each endpoint SHALL include `summary`, `description`, and `tags` so that the auto-generated Swagger UI at `/docs` is human-readable.

#### Scenario: Swagger UI accessible

- **WHEN** a developer navigates to `https://mathsnap-xi.up.railway.app/docs`
- **THEN** the Swagger UI displays "MathSnap API" with version 1.0.0 and endpoint descriptions
