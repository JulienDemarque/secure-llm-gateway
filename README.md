# SecureLLM Gateway

Minimal Node.js/TypeScript placeholder API scaffold for the SecureLLM challenge.

## Quick start

- Install dependencies: `npm install`
- Run in dev mode: `npm run dev`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## Placeholder endpoints

- `GET /healthz`
- `POST /v1/chat`
- `GET /v1/audit`

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
