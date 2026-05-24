# Development environment preflight

Use this checklist before implementation to ensure the local environment supports all mandatory challenge requirements.

## Current local status (2026-05-24)

- [x] Node.js available (`v20.20.2` at initial preflight)
- [x] npm available (`10.8.2` at initial preflight)
- [x] Docker available (`27.3.1` at initial preflight)
- [x] Docker Compose available (`v2.29.7-desktop.1` at initial preflight)
- [x] gitleaks available (`8.2.3` at initial preflight)

## Pre-coding checklist

- [x] Initialize project with TypeScript `strict: true`.
- [x] Add `.gitleaks.toml` (or equivalent) at repo root.
- [x] Add a local command and CI job for secret scanning.
- [x] Define required env vars for provider keys and persistence services.
- [x] Ensure `docker-compose up` can start service + Mongo + Redis + Ollama in one command.
- [x] Ensure missing provider key behavior is implemented (`/v1/chat` returns `503`, `/healthz` flags provider not ready).

## Suggested preflight commands

- `node -v`
- `npm -v`
- `docker --version`
- `docker compose version`
- `gitleaks version`
- `gitleaks detect --config .gitleaks.toml --source . --no-git`

## Runtime preflight (before integration/eval runs)

- `curl http://localhost:3000/healthz` — expect `mongo`, `redis`, `ollama`, and provider readiness signals.
- `npm run seed:api-keys` — bootstrap admin/client keys when Mongo is empty.
- `docker compose exec ollama ollama pull llama3.1:8b` — ensure prompt-guard model is present when using Compose Ollama.
