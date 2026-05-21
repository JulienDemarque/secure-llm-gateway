# SecureLLM Gateway

Minimal Node.js/TypeScript placeholder API scaffold for the SecureLLM challenge.

## Quick start

- Install dependencies: `npm install`
- Run in dev mode: `npm run dev`
- Typecheck: `npm run typecheck`
- Run tests: `npm test`
- Run Redis integration tests: `npm run test:integration:redis`
- Build: `npm run build`

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

## Provider configuration (LiteLLM SDK path)

Set one provider key for the LiteLLM SDK call:

- `OPENAI_API_KEY`, or
- `ANTHROPIC_API_KEY`

`/v1/chat` returns `503` when neither key is configured.

## Prompt guard configuration (local Ollama)

Prompt-injection detection uses a local Ollama model by default.

- `OLLAMA_HOST` (optional, default `http://127.0.0.1:11434` outside Docker, `http://ollama:11434` in Docker Compose)
- `PROMPT_GUARD_MODEL` (optional, default `llama3.1:8b`)

If API runs in Docker and Ollama runs on host machine (macOS), set:

- `OLLAMA_HOST=http://host.docker.internal:11434`

## Run with Docker

Start API + Mongo + Redis + Ollama:

```bash
docker compose up -d --build
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

Swagger UI for manual testing:

```bash
open http://localhost:3000/docs
```
