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
