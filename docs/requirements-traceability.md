# Requirements traceability

This document maps assignment requirements from `docs/original-assignment.md` to implementation artifacts and current status.

## Mandatory requirement mapping

- Endpoints (`POST /v1/chat`, `GET /v1/audit`, `GET /healthz`)
  - Implemented in: `src/app.ts`, `src/server.ts`
  - Documented in: `README.md`, `docs/technical-architecture-outline.md`
  - Status: **implemented**
- Independent security middleware controls
  - Implemented in: `src/middleware/*`, `src/detectors/*`, `src/redaction/*`, `src/validation/*`
  - Status: **implemented** (auth, rate limit, prompt injection, PII redaction, output validation)
- Prompt-injection detection with coverage of Appendix patterns and variations
  - Implemented in: `src/detectors/generic-llm-prompt-injection-detector.ts`, `src/middleware/prompt-injection-guard.ts`
  - Evaluated in: `src/app.adversarial.integration.test.ts`, `test-prompts/raw/adversarial-test-prompts.json`
  - Status: **implemented** (score-based adversarial eval; not 100% corpus pass rate expected without fine-tuning)
- PII redaction (email, phone IL+intl, Israeli national ID), reversible via audit path
  - Implemented in: `src/redaction/*`, audit reconstruction in `src/app.ts`
  - Status: **implemented**
- Output validation for secrets and echoed injection content
  - Implemented in: `src/validation/output-validator.ts`
  - Status: **implemented**
- Audit logging requirements (hashes, latency, decision, detected threats)
  - Implemented in: `src/audit/*`, Mongo `audit_logs` collection
  - Status: **implemented**
- Secrets handling: env vars only; include `.gitleaks.toml` or equivalent
  - Implemented in: `.gitleaks.toml`, `.github/workflows/ci.yml`, `.githooks/pre-commit`
  - Status: **implemented**
- TypeScript with `strict: true`
  - Implemented in: `tsconfig.json`
  - Status: **implemented**
- Unit tests for security controls
  - Implemented in: `src/**/*.test.ts`, CI via `npm run test:coverage`
  - Status: **implemented** (~89% line coverage locally; 70% CI gate)
- Dockerfile + docker-compose service stack
  - Implemented in: `Dockerfile`, `docker-compose.yml`
  - Status: **implemented**
- README sections (run instructions, env vars, control-by-control architecture, known limitations)
  - Implemented in: `README.md`
  - Status: **implemented**
- PROMPTS.md process evidence and first prompt traceability
  - Implemented in: `PROMPTS.md`
  - Status: **implemented**

## Residual gaps (explicit, non-blocking for assignment baseline)

- Pre-commit hook activation is documented but opt-in per developer machine (`git config core.hooksPath .githooks`).
- Detector timeout/fallback policy is not yet formalized (see `docs/productionalization-notes.md`).
- LangSmith / advanced observability integration deferred to post-assignment follow-up.
- Adversarial eval reports assertion scores; perfect corpus alignment is not expected without model fine-tuning.

## Gaps found in plan and now addressed

- Pre-coding environment readiness checks were implicit and are now explicit in `docs/dev-environment-preflight.md`.
- Requirement-to-plan verification was implicit and is now explicit in this traceability document.
- Secret scanning requirement (`.gitleaks.toml`) is implemented and enforced in CI and local hooks.
