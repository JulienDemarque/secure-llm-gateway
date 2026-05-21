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
- Live `/v1/chat` call path via LiteLLM-compatible `/chat/completions` endpoint (guardrails pending).

## Provider configuration (LiteLLM SDK path)

Set one provider key for the LiteLLM SDK call:

- `OPENAI_API_KEY`, or
- `ANTHROPIC_API_KEY`

`/v1/chat` returns `503` when neither key is configured.

## Run with Docker

Start API + Mongo + Redis:

```bash
docker compose up -d --build
```

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

Swagger UI for manual testing:

```bash
open http://localhost:3000/docs
```
