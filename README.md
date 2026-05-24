# SecureLLM Gateway

[![codecov](https://codecov.io/gh/JulienDemarque/secure-llm-gateway/graph/badge.svg?token=iowv5ewp8g)](https://codecov.io/gh/JulienDemarque/secure-llm-gateway)

Production-oriented security gateway for LLM APIs — auth, rate limiting, prompt-injection detection, PII redaction, output validation, and audit logging.

## Quick start

- Install dependencies: `npm install`
- Run in dev mode: `npm run dev`
- Typecheck: `npm run typecheck`
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Run Redis integration tests: `npm run test:integration:redis`
- Run adversarial corpus eval tests: `npm run test:eval:adversarial`
- Build: `npm run build`

## Documentation index

Project docs are consolidated under `docs/`:

- `docs/implementation-plan.md`: phased implementation checklist and remaining scope.
- `docs/technical-architecture-outline.md`: architecture, trust boundaries, and middleware layout.
- `docs/research-matrix.md`: research topics, options, and recommendations.
- `docs/detection-approach-comparison.md`: detector approach tradeoffs.
- `docs/iteration-protocol.md`: small-step iteration workflow.
- `docs/change-log.md`: chronological implementation log.
- `docs/test-prompts-guidelines.md`: adversarial dataset contract and safety guidance.
- `docs/dev-environment-preflight.md`: local environment readiness checks.
- `docs/requirements-traceability.md`: mapping from assignment requirements to implementation.
- `docs/security-ci-baseline.md`: secret scan / CI baseline.
- `docs/ollama-js-integration-notes.md`: Ollama SDK constraints and integration notes.
- `docs/productionalization-notes.md`: follow-up hardening and scale notes.
- `docs/context-budget-guidelines.md`: guidance for keeping context focused.

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and pull request:

- gitleaks secret scan (`.gitleaks.toml`)
- TypeScript typecheck
- Unit test suite with LCOV coverage output
- Codecov upload (`coverage/lcov.info`)

For private repositories, set `CODECOV_TOKEN` in GitHub repository secrets.

## API endpoints

- `GET /healthz` — liveness and dependency readiness (Mongo, Redis, Ollama, provider)
- `POST /v1/chat` — chat proxy through the full security pipeline (`x-api-key` required)
- `GET /v1/audit` — paginated audit log retrieval (`admin` role required)
- `GET /openapi.json` — OpenAPI spec
- `GET /docs` — Swagger UI for manual testing

## Current implemented controls

- API key authentication (`x-api-key`) with Mongo-backed hashed key lookup.
- Role-based authorization (`admin` required for `/v1/audit`).
- Per-API-key Redis sliding-window rate limiting (default 30 req/min, configurable per key).
- Live `/v1/chat` call path via LiteLLM SDK with provider API keys from env.
- Model-assisted prompt-injection guard on `/v1/chat` using structured JSON detector output.
- Mongo audit logging for every `/v1/chat` request (`allowed` / `blocked` / `error`) with request/response hashes.
- Deterministic inbound PII redaction (email, phone, Israeli ID) with reversible token persistence.
- Outbound output validation blocks secret-shaped leaks (`sk-*`, JWT, AWS access key) and injection-echo responses; outbound PII is redacted before returning to client.
- Structured JSON logging via `pino` with per-request `correlationId` (request start/end + latency + status).
- `correlationId` is stored in both `audit_logs` and `redaction_tokens` for deterministic linkage.

## Security architecture by control

**1) Authentication and authorization.** Every protected route requires `x-api-key`, which is looked up as a hash-backed credential in Mongo. Request context includes key identity and role, and authorization is enforced as a separate middleware so only `admin` keys can access `/v1/audit`.

**2) Rate limiting.** A Redis sliding-window limiter runs per API key and is isolated from auth/business logic. The default limit is 30 req/min and can be configured per key, with deterministic `429` behavior when the window is exceeded.

**3) Prompt-injection detection (inbound).** Incoming chat messages are classified before provider calls using a structured-output detector contract (rule ID + confidence + rationale). Requests classified as injection are blocked with `400`, and detector failures are surfaced explicitly as gateway errors.

**4) PII redaction (inbound, reversible).** Before forwarding to the provider, inbound message content is scanned for required categories (email, phone IL+intl, Israeli national ID) and replaced with token placeholders. Original spans are encrypted and persisted so audit retrieval can reconstruct originals for authorized administrators.

**5) Output validation (outbound).** Model output is treated as untrusted and inspected for secret-shaped leakage patterns and injection-echo behavior. Matching responses are blocked, and outbound PII spans are redacted before returning content to the caller.

**6) Audit logging.** Every `/v1/chat` request writes an audit record in Mongo with timestamps, API key ID, model, request/response hashes, latency, status (`allowed`/`blocked`/`error`), and threat metadata. Correlation IDs connect request logs, redaction records, and structured runtime logs.

**7) Secrets handling.** Provider credentials are sourced from environment variables only; no secrets are committed in code or logged in plaintext. Repository-level secret scanning is enforced via `.gitleaks.toml` and CI, with additional local pre-commit coverage available.

## Provider configuration (LiteLLM SDK path)

Set one provider key for the LiteLLM SDK call:

- `OPENAI_API_KEY`, or
- `ANTHROPIC_API_KEY`

`/v1/chat` returns `503` when neither key is configured.

## Prompt guard configuration (local Ollama)

Prompt-injection detection uses a local Ollama model by default.

- `OLLAMA_HOST` (optional, default `http://127.0.0.1:11434` outside Docker, `http://ollama:11434` in Docker Compose)
- `PROMPT_GUARD_MODEL` (optional, default `llama3.1:8b`)
- `PROMPT_GUARD_DEBUG` (optional, set to `1` to log detector decisions/errors in API logs)
- `LOG_LEVEL` (optional, default `info`)

If API runs in Docker and Ollama runs on host machine (macOS), set:

- `OLLAMA_HOST=http://host.docker.internal:11434`

## PII redaction encryption configuration

Required for reversible token-based redaction:

- `PII_ENCRYPTION_KEY_B64` (base64-encoded 32-byte key)
- `PII_ENCRYPTION_KEY_ID` (key identifier stored alongside token records)

## Run with Docker

Start API + Mongo + Redis + Ollama:

```bash
docker compose up -d --build
```

Start hot-reload API (development mode inside Docker):

```bash
docker compose --profile dev up -d --build api-dev
```

or:

```bash
npm run docker:up:dev
```

This runs `tsx watch` in the container and reloads on source changes.
Use `api-dev` logs when in dev mode:

```bash
docker compose logs -f --tail=200 api-dev
```

Pull the prompt-guard model inside Compose network:

```bash
docker compose exec ollama ollama pull llama3.1:8b
```

Optional memory tuning for local Ollama in Compose (set in `.env` before `docker compose up`):

- `OLLAMA_MEM_LIMIT` (default `14g`)
- `OLLAMA_MEMSWAP_LIMIT` (default `16g`)
- `OLLAMA_NUM_PARALLEL` (default `1` to reduce concurrent memory pressure)
- `OLLAMA_KEEP_ALIVE` (default `5m`)

Ollama is only exposed to other Compose services (no host `11434` port mapping by default).

Stop stack:

```bash
docker compose down
```

## Enable pre-commit hook

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

Verify:

```bash
git config --get core.hooksPath
```

Expected output: `.githooks`

Current pre-commit checks:

- gitleaks secret scan
- TypeScript typecheck (`npm run typecheck`)

## Auth bootstrap (Mongo)

- Set `MONGODB_URI` in `.env`
- Seed one admin and one client API key:

```bash
npm run seed:api-keys
```

This command prints plaintext keys once and stores only hashed keys in Mongo.

If running via Docker Compose:

```bash
docker compose exec api node dist/scripts/seed-api-keys.js
```

Quick health check:

```bash
curl http://localhost:3000/healthz
```

`/healthz` now reports `mongo`, `redis`, `ollama`, and provider readiness.

Query audit logs as admin:

```bash
curl -H "x-api-key: $ADMIN_API_KEY" "http://localhost:3000/v1/audit?limit=100"
```

Recover original inbound request content at audit time (admin only):

```bash
curl -H "x-api-key: $ADMIN_API_KEY" "http://localhost:3000/v1/audit?limit=100&includeOriginal=true"
```

`includeOriginal=true` returns both:

- `redactedRequest` (the payload that was forwarded after tokenization)
- `originalRequest` (best-effort reconstruction by decrypting token mappings for each `correlationId`)

Swagger UI for manual testing:

```bash
open http://localhost:3000/docs
```

Tail API logs only (exclude Mongo/Redis noise):

```bash
docker compose logs -f --tail=200 api
```

## What this service does not protect against

Current controls are focused on authentication, rate limiting, prompt-injection defense, PII redaction, outbound secret-pattern blocking, and auditability. This gateway does **not** currently guarantee protection against:

- toxicity, hate, harassment, or other general safety/content-policy violations (no dedicated moderation classifier in the current path)
- hallucinations or factual correctness issues in model responses
- jailbreaks that evade both input and output heuristics/classifiers (best-effort, not perfect prevention)
- advanced exfiltration channels outside currently enforced secret patterns (for example, encoded/obfuscated leakage variants not yet covered by tests)
- business-logic abuse at the application layer outside gateway controls

### Prompt-guard scope clarification

- The current prompt-injection detector is a dedicated classifier prompt running on local Ollama (`PROMPT_GUARD_MODEL`, default `llama3.1:8b`).
- It is tuned for corpus-aligned prompt-injection behavior and rule mapping (`INJ-*`), not full-spectrum content moderation.
- If you want broader policy coverage (toxicity/violence/self-harm/etc.), add a separate moderation control (for example a dedicated model or policy engine) as an independent middleware.

## Adversarial corpus eval test

- The eval test reads local dataset file: `test-prompts/raw/adversarial-test-prompts.json`.
- It replays each case against a running gateway instance over HTTP (`ADVERSARIAL_EVAL_BASE_URL`, default `http://127.0.0.1:3000`) and asserts expected outcomes from the dataset contract in `docs/test-prompts-guidelines.md`.
- It is intentionally separate from default unit test suite.
- Run with:

```bash
npm run test:eval:adversarial
```

Notes:

- This eval uses real gateway dependencies (auth/rate-limit/detector/provider/audit), with no in-test repository or provider mocks.
- Required env vars for eval runner:
  - `CLIENT_API_KEY` (used for `/v1/chat`)
  - `ADMIN_API_KEY` (required for PII-redaction assertions via `/v1/audit`)
  - optional `ADVERSARIAL_EVAL_BASE_URL` (defaults to `http://127.0.0.1:3000`)
- Optional eval scoring controls:
  - `ADVERSARIAL_EVAL_MIN_ASSERTION_SCORE_PERCENT` (default `0`; fail only if assertion score is below threshold)
  - `ADVERSARIAL_EVAL_FAIL_ON_ANY_MISMATCH=1` (strict mode; fail on any mismatch)
- PII eval semantics:
  - for `PII-*` / `mustRedactInboundPii=true` cases, scoring focuses on redaction evidence in audit records (`redactedRequest` token placeholders), not prompt-injection `ruleId`/`owaspCategory`.
  - these PII redaction cases are normalized to `200` expected status (redact-and-allow behavior) for scoring.
- Preflight requires `/healthz` to report both `dependencies.ollama=ready` and `dependencies.provider=ready`.
- `test-prompts/` files remain local and ignored by repository tooling; the eval only reads them.

### Performance note (assignment vs production)

- In local/home environments without GPU acceleration, prompt-guard classification latency can be in the ~10-30s range per request depending on machine load and prompt size (this is acceptable for assignment-grade adversarial eval runs).
- For production targets, use GPU acceleration for detector runtime (or a smaller/faster guard model) and enforce explicit detector timeout/fallback policy to keep request latency predictable.

## Coverage gate

- `npm run test:coverage` now runs unit tests with coverage and enforces a minimum line-coverage gate.
- Default gate is `70%` lines across the measured codebase.
- Override locally (or in CI) with `COVERAGE_MIN_LINES_PERCENT`, for example:
  - `COVERAGE_MIN_LINES_PERCENT=75 npm run test:coverage`
