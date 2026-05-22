# SecureLLM Gateway

Minimal Node.js/TypeScript placeholder API scaffold for the SecureLLM challenge.

## Quick start

- Install dependencies: `npm install`
- Run in dev mode: `npm run dev`
- Typecheck: `npm run typecheck`
- Run tests: `npm test`
- Run Redis integration tests: `npm run test:integration:redis`
- Build: `npm run build`

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and pull request:

- gitleaks secret scan (`.gitleaks.toml`)
- TypeScript typecheck
- Unit test suite

## Placeholder endpoints

- `GET /healthz`
- `POST /v1/chat`
- `GET /v1/audit`
- `GET /openapi.json`
- `GET /docs` (Swagger UI)

## Current implemented controls

- API key authentication (`x-api-key`) with Mongo-backed hashed key lookup.
- Role-based authorization (`admin` required for `/v1/audit`).
- Per-API-key Redis sliding-window rate limiting (default 30 req/min, configurable per key).
- Live `/v1/chat` call path via LiteLLM SDK with provider API keys from env.
- Model-assisted prompt-injection guard on `/v1/chat` using structured JSON detector output.
- Mongo audit logging for every `/v1/chat` request (`allowed` / `blocked` / `error`) with request/response hashes.
- Deterministic inbound PII redaction (email, phone, Israeli ID) with reversible token persistence.
- Outbound output validation blocks secret-shaped leaks (`sk-*`, JWT, AWS access key) and injection-echo responses; outbound PII is redacted before returning to client.
- `correlationId` is stored in both `audit_logs` and `redaction_tokens` for deterministic linkage.

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
