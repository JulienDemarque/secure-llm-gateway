# Development environment preflight

Use this checklist before implementation to ensure the local environment supports all mandatory challenge requirements.

## Current local status (2026-05-21)

- [x] Node.js available (`v20.20.2`)
- [x] npm available (`10.8.2`)
- [x] Docker available (`27.3.1`)
- [x] Docker Compose available (`v2.29.7-desktop.1`)
- [x] gitleaks available (`8.2.3`)

## Pre-coding checklist

- [ ] Initialize project with TypeScript `strict: true`.
- [ ] Add `.gitleaks.toml` (or equivalent) at repo root.
- [ ] Add a local command and CI job for secret scanning.
- [ ] Define required env vars for provider keys and persistence services.
- [ ] Ensure `docker-compose up` can start service + Mongo + Redis in one command.
- [ ] Ensure missing provider key behavior is planned (`/v1/chat` returns `503`, `/healthz` flags provider not ready).

## Suggested preflight commands

- `node -v`
- `npm -v`
- `docker --version`
- `docker compose version`
- `gitleaks version`
- `gitleaks detect --config .gitleaks.toml --source . --no-git`
