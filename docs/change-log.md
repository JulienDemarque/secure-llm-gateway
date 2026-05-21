# Change log

Tracks repository changes made during this project. Each entry summarizes what changed and why.

## 2026-05-21 - Iteration 1 (safety and docs bootstrap)

- Added safety ignores:
  - created `.gitignore` with `test-prompts/` plus basic local artifact ignores
  - created `.claudeignore` with `test-prompts/`
- Added planning and architecture docs:
  - `docs/README.md`
  - `docs/implementation-plan.md`
  - `docs/technical-architecture-outline.md`
  - `docs/research-matrix.md`
  - `docs/detection-approach-comparison.md`
  - `docs/iteration-protocol.md`
- Added Cursor rules:
  - `.cursor/rules/safe-iteration-loop.mdc`
  - `.cursor/rules/untrusted-prompt-corpus-handling.mdc`
- Note: `.cursorignore` creation was blocked by workspace permissions.

## 2026-05-21 - Iteration 2 (requested adjustments)

- Updated `.cursor/rules/safe-iteration-loop.mdc`:
  - added rule to keep `docs/original-assignment.md` in active context to avoid requirement drift.
- Converted `docs/implementation-plan.md` into a checklist format:
  - added phase-based `[ ]` / `[x]` tracking for progress visibility.
- Added this `docs/change-log.md` file:
  - established logging requirement so each future change is summarized in this file.
- Note: `.cursorignore` creation still blocked by workspace permissions.

## 2026-05-21 - Iteration 3 (cursorignore validation and corpus guidance)

- Validated `.cursorignore` content:
  - confirmed `test-prompts/` entry exists and is syntactically correct.
- Added `docs/test-prompts-guidelines.md`:
  - documented local `test-prompts/` folder layout and safety handling rules.
- Updated documentation trackers:
  - added guidelines doc to `docs/README.md`
  - marked `.cursorignore` and contributor guidance checklist items complete in `docs/implementation-plan.md`
- Note: creating files directly under `test-prompts/` was blocked by local filesystem permissions in this environment.

## 2026-05-21 - Iteration 4 (preflight and requirement alignment)

- Re-validated assignment expectations from `docs/original-assignment.md`, including:
  - mandatory secret scanning config (`.gitleaks.toml` or equivalent)
  - pre-release readiness around Docker, tests, and process evidence.
- Ran local environment checks and confirmed availability:
  - Node.js, npm, Docker, Docker Compose, and gitleaks are installed.
- Added `docs/dev-environment-preflight.md`:
  - captured tool status and pre-coding readiness checklist.
- Added `docs/requirements-traceability.md`:
  - mapped mandatory requirements to planned docs/checkpoints and marked implementation status.
- Updated `docs/implementation-plan.md`:
  - introduced new Phase 0 for environment and requirement preflight tasks.
- Updated `docs/README.md`:
  - added preflight and traceability docs to the docs index.

## 2026-05-21 - Iteration 5 (gitleaks baseline setup)

- Added `.gitleaks.toml` at repo root:
  - enabled default gitleaks detection rules for secret scanning.
- Added `docs/security-ci-baseline.md`:
  - defined minimum CI checks (secret scan + tests on push/PR).
  - documented local scan command using the new gitleaks config.
- Updated `docs/dev-environment-preflight.md`:
  - added the concrete gitleaks detect command to preflight checks.
- Updated `docs/implementation-plan.md`:
  - marked Phase 0 tasks complete for gitleaks config and CI baseline definition.
- Updated `docs/README.md`:
  - added security/CI baseline doc to the docs index.

## 2026-05-21 - Iteration 6 (pre-commit planning and Ollama JS research)

- Expanded `docs/security-ci-baseline.md`:
  - added explicit pre-commit baseline checks (gitleaks + fast quality gate).
  - documented recommendation to use lightweight hooks and keep full checks in CI.
- Updated `docs/implementation-plan.md`:
  - marked pre-commit baseline definition complete in Phase 0.
  - added a Phase 6 task to implement pre-commit hooks.
- Added `docs/ollama-js-integration-notes.md`:
  - captured SDK constraints (streaming/abort/host/options) and required integration guardrails.
  - documented initial timeout/fallback and observability requirements.
- Updated `docs/research-matrix.md`:
  - added dedicated Ollama JS SDK detection research topic with alternatives and recommendation.
- Updated `docs/detection-approach-comparison.md`:
  - added concrete implementation guardrails and missing-data checklist for decision lock.
- Updated `docs/README.md`:
  - added Ollama JS integration notes to docs index.

## 2026-05-21 - Iteration 7 (early pre-commit and productionalization docs)

- Added pre-commit hook scaffold:
  - created `.githooks/pre-commit` running gitleaks with repo config.
- Expanded `docs/security-ci-baseline.md`:
  - documented current hook scaffold and activation options.
- Updated `docs/implementation-plan.md`:
  - moved pre-commit from late hardening to early scaffold completion.
  - kept explicit activation as a remaining task.
- Added `docs/productionalization-notes.md`:
  - documented scale path (detector sidecar), load testing, resilience, and rollout priorities.
- Added `docs/context-budget-guidelines.md`:
  - defined minimal active docs set to avoid context bloat.
- Updated `.cursor/rules/safe-iteration-loop.mdc`:
  - added concise-docs/minimal-context rule.
- Updated `docs/README.md`:
  - indexed productionalization and context-budget docs.

## 2026-05-21 - Iteration 8 (Node.js API placeholder scaffold)

- Re-validated assignment functional requirements before coding:
  - required endpoints and request shape
  - `strict: true` TypeScript requirement
  - `/v1/chat` returns clear `503` when provider key is missing.
- Initialized Node/TypeScript API scaffold:
  - added `package.json` scripts for dev/build/start/typecheck
  - installed `express`, `typescript`, `tsx`, and type dependencies
  - added `tsconfig.json` with `strict: true`
  - added `src/server.ts` and `src/app.ts`
- Implemented placeholder endpoints:
  - `GET /healthz` returns dependency readiness placeholders and provider readiness
  - `POST /v1/chat` validates shape/header, returns `503` if no provider key, `501` otherwise
  - `GET /v1/audit` returns `501` placeholder
- Added concise root `README.md` with quick start and route list.
- Updated `docs/implementation-plan.md`:
  - marked Node.js placeholder route bootstrap complete.

## 2026-05-21 - Iteration 9 (official-doc research rule)

- Updated `.cursor/rules/safe-iteration-loop.mdc`:
  - added a rule to check official documentation and best-practice guidance before implementation work.
  - included Node.js/Express as explicit example for API-related changes.

## 2026-05-21 - Iteration 10 (Express/Node doc-aligned hardening)

- Updated `src/app.ts`:
  - made JSON parser limit explicit with `express.json({ limit: "100kb" })`.
  - added malformed JSON handler returning `400` with `invalid-json` error payload.
- Updated `src/server.ts`:
  - hardened `PORT` parsing with safe integer parsing and fallback to `3000`.

## 2026-05-21 - Iteration 11 (.env loading fix)

- Added `dotenv` dependency and loaded it in `src/server.ts` with `import "dotenv/config";`.
- Result: environment variables from root `.env` are now available to `hasProviderKey()` at runtime.

## 2026-05-21 - Iteration 12 (README pre-commit activation steps)

- Updated `README.md`:
  - added concise commands to enable `.githooks/pre-commit`.
  - added verification command for `core.hooksPath`.

## 2026-05-21 - Iteration 13 (iteration-discipline rule hardening)

- Updated `.cursor/rules/safe-iteration-loop.mdc`:
  - made per-iteration check of `docs/original-assignment.md` explicit.
  - required updating `docs/implementation-plan.md` at the end of each iteration.
- Updated `docs/implementation-plan.md` scope checklist:
  - added explicit reminder to re-check assignment requirements and update checklist every iteration.

## 2026-05-21 - Iteration 14 (auth architecture design review pass)

- Re-checked assignment requirements before auth planning (hashed API keys in Mongo, `client/admin` roles, admin-only `/v1/audit`).
- Updated `docs/technical-architecture-outline.md` with a dedicated auth design section:
  - middleware contract (`authenticateApiKey`, `requireAdmin`)
  - verification flow and request auth-context shape
  - Mongo API key schema fields and status model
  - response behavior (`401`/`403`) and auth test cases
  - security notes on header-only key handling, no raw-key logging, and constant-time compare guidance
  - added official references (OWASP + Node crypto docs).
- Updated `docs/implementation-plan.md`:
  - marked auth architecture documentation task complete for review.

## 2026-05-21 - Iteration 15 (db schema + ODM decision)

- Re-checked assignment auth/persistence requirements (`Mongo` for hashed API keys and audit logs, `Redis` for rate limiting).
- Updated `docs/technical-architecture-outline.md`:
  - clarified API key provisioning as seed/bootstrap scope (no user auth flow required in challenge scope).
  - added persistence stack decision: choose `mongoose` over `prisma` for this challenge.
  - added concrete Mongo schema outlines for `api_keys`, `audit_logs`, and `redaction_tokens` with indexes.
  - added Redis rate-limit key pattern.
  - added official references for Mongoose and Prisma Mongo docs.
- Updated `docs/implementation-plan.md`:
  - marked persistence library decision + schema documentation task complete.

## 2026-05-21 - Iteration 16 (PII token encryption clarification)

- Updated `docs/technical-architecture-outline.md`:
  - clarified that tokenized redaction stores encrypted original values only (admin audit path can decrypt).
  - expanded `redaction_tokens` schema to include `ciphertext`, `iv`, `authTag`, and `keyId`.
  - documented AES-256-GCM flow for encrypt/decrypt and the role of `token`.
  - added required env secrets: `PII_ENCRYPTION_KEY_B64` and `PII_ENCRYPTION_KEY_ID`.
- Updated `docs/implementation-plan.md`:
  - marked redaction encryption/decryption design documentation complete.

## 2026-05-21 - Iteration 17 (Mongo auth foundation + tests)

- Re-checked assignment requirements before implementation (`x-api-key` auth, hashed keys in Mongo, `client/admin` roles, admin-only `/v1/audit`, independent middleware and auth tests).
- Added Mongo/auth domain and persistence modules:
  - `src/domain/auth.ts`
  - `src/security/hash.ts`
  - `src/db/mongoose.ts`
  - `src/models/api-key.ts`
  - `src/repositories/mongo-api-key-repository.ts`
- Added auth middleware:
  - `src/middleware/authenticate-api-key.ts`
  - `src/middleware/require-admin.ts`
  - `src/types/express.d.ts` request auth context typing
- Wired app/server:
  - `src/app.ts` now uses auth middleware for `/v1/chat` and `/v1/audit`
  - `src/app.ts` health now reports Mongo readiness from connection state
  - `src/server.ts` now bootstraps Mongo connection when `MONGODB_URI` is configured
- Added API key seed script:
  - `src/scripts/seed-api-keys.ts`
  - generates admin/client keys, stores hash only, prints plaintext once
- Added auth tests (Vitest + Supertest):
  - `src/app.auth.test.ts` covering missing/invalid/revoked keys and client/admin role behavior
- Updated project scripts and docs:
  - `package.json` scripts: `test`, `test:watch`, `seed:api-keys`
  - `README.md` updated with test command and auth seed usage
  - `docs/implementation-plan.md` marked auth module/tests complete
- Validation:
  - `npm run typecheck` passed
  - `npm test` passed (6 tests)
  - `npm run build` passed

## 2026-05-21 - Iteration 18 (function documentation rule)

- Clarified `safeEqualHash` usage and intent in code:
  - added concise JSDoc comments in `src/security/hash.ts` for `hashApiKey` and `safeEqualHash`.
- Updated `.cursor/rules/safe-iteration-loop.mdc`:
  - added rule to document functions with concise comments using Node.js/TypeScript best practice (JSDoc for exported and non-obvious logic).
- Updated `docs/implementation-plan.md`:
  - marked code-commenting convention rule as completed under safety scaffolding.

## 2026-05-21 - Iteration 19 (comment pass across existing code)

- Added concise function-level comments/JSDoc across current source modules:
  - `src/app.ts`
  - `src/server.ts`
  - `src/domain/auth.ts`
  - `src/db/mongoose.ts`
  - `src/models/api-key.ts`
  - `src/repositories/mongo-api-key-repository.ts`
  - `src/middleware/authenticate-api-key.ts`
  - `src/middleware/require-admin.ts`
  - `src/types/express.d.ts`
  - `src/scripts/seed-api-keys.ts`
  - `src/app.auth.test.ts`
- Kept comments focused on intent and security-sensitive behavior, avoiding line-by-line noise.
- Updated test scripts in `package.json` to avoid accidentally running compiled `dist` tests:
  - `test` now runs `vitest run src/app.auth.test.ts`
  - `test:watch` now runs `vitest src/app.auth.test.ts`
- Updated `docs/implementation-plan.md`:
  - marked function-level comment pass complete under architecture baseline tasks.
- Validation:
  - `npm run typecheck` passed
  - `npm test` passed (6 tests)
  - `npm run build` passed

## 2026-05-21 - Iteration 20 (dockerization + db GUI research)

- Re-checked assignment requirement to provide `Dockerfile` and `docker-compose.yml` for one-command startup of API + Mongo + Redis.
- Added containerization files:
  - `.dockerignore`
  - `Dockerfile` (multi-stage build/runtime image)
  - `docker-compose.yml` (api, mongo, redis, volumes, health checks)
- Updated runtime health placeholder:
  - `src/app.ts` now reports Redis as `not-ready` when `REDIS_URL` is configured (until live Redis ping middleware is added).
- Added developer convenience scripts in `package.json`:
  - `docker:up`
  - `docker:down`
- Updated `README.md`:
  - added Docker startup/shutdown commands
  - added compose seed command using compiled script (`node dist/scripts/seed-api-keys.js`)
  - added health check command example
- Fixed seed script deprecation warning:
  - `src/scripts/seed-api-keys.ts` now uses `returnDocument: "after"` instead of deprecated `new`.
- Validation:
  - local checks passed (`npm run typecheck`, `npm test`, `npm run build`)
  - `docker compose up -d --build` succeeded
  - compose services healthy/running (`api`, `mongo`, `redis`)
  - seeding against Docker Mongo succeeded
  - `/healthz` returned Mongo ready
- Research completed for GUI tools to inspect databases:
  - MongoDB: MongoDB Compass (official), Studio 3T, NoSQLBooster
  - Redis: RedisInsight (official), Another Redis Desktop Manager, Medis (macOS)

## 2026-05-21 - Iteration 21 (mongo auth production note)

- Updated `docs/productionalization-notes.md`:
  - added explicit Mongo authentication hardening guidance for production (DB users/roles, least privilege, secret hygiene, network isolation).
- Updated `docs/implementation-plan.md`:
  - marked production Mongo authentication hardening documentation task complete.

## 2026-05-21 - Iteration 22 (Swagger/OpenAPI manual test surface)

- Re-checked assignment endpoint contract before adding API docs (`/healthz`, `/v1/chat`, `/v1/audit`).
- Added Swagger/OpenAPI support:
  - installed `swagger-ui-express` and `@types/swagger-ui-express`
  - added `src/docs/openapi.ts` with minimal OpenAPI 3.0 spec
  - wired endpoints in `src/app.ts`:
    - `GET /openapi.json`
    - `GET /docs` (Swagger UI; redirects to `/docs/`)
- Updated `README.md`:
  - documented manual API testing endpoints (`/openapi.json`, `/docs`)
  - added quick open command for Swagger UI.
- Validation:
  - local checks passed (`npm run typecheck`, `npm test`, `npm run build`)
  - Docker API rebuilt successfully
  - docs endpoints reachable (`/docs/` -> 200, `/openapi.json` -> 200)
- Updated `docs/implementation-plan.md`:
  - marked minimal OpenAPI/Swagger documentation task complete.

## 2026-05-21 - Iteration 23 (provider abstraction research TODOs)

- Updated `docs/implementation-plan.md` Phase 2 checklist:
  - added explicit research task for provider abstraction choice (`LiteLLM` vs `LangChain`).
  - added explicit research task for `LangSmith` observability fit and scope decision.
- Updated `docs/technical-architecture-outline.md` prioritized TODOs:
  - added provider abstraction decision checkpoint.
  - added tracing/observability integration decision checkpoint.

## 2026-05-21 - Iteration 24 (Redis sliding-window rate limiting)

- Re-checked assignment requirement for Redis per-API-key sliding-window limit (default 30 req/min, configurable per key).
- Added rate-limit domain and infrastructure:
  - `src/domain/rate-limit.ts` (rate-limit result/store interfaces)
  - `src/db/redis.ts` (redis connect/health/client lifecycle)
  - `src/repositories/redis-rate-limit-store.ts` (Redis sorted-set sliding-window implementation via Lua script)
  - `src/repositories/noop-rate-limit-store.ts` (fallback when Redis is not configured)
  - `src/middleware/rate-limit-per-api-key.ts`
- Wired middleware into API flow:
  - `src/app.ts` now applies rate limiting after auth on `/v1/chat` and `/v1/audit`
  - `src/app.ts` health now reports Redis readiness from live client state
  - `src/server.ts` now initializes Redis connection during bootstrap
- Added tests:
  - `src/app.rate-limit.test.ts` covering allow-under-limit, block-over-limit (`429`), and per-key isolation
  - updated test scripts in `package.json` to run both auth and rate-limit suites
- Updated docs:
  - `README.md` now lists currently implemented controls
  - `src/docs/openapi.ts` now includes `429` response documentation
  - `docs/implementation-plan.md` marks rate limiting module/tests complete
- Validation:
  - `npm run typecheck` passed
  - `npm test` passed (9 tests)
  - `npm run build` passed
  - Docker API rebuilt and `/healthz` reports `mongo: ready`, `redis: ready`

## 2026-05-21 - Iteration 25 (Redis integration tests for rate limiting)

- Added real Redis-backed integration test suite:
  - `src/app.rate-limit.redis.integration.test.ts`
  - validates `429` on limit exceed using live Redis counters
  - validates per-key counter isolation using live Redis state
- Added dedicated script in `package.json`:
  - `test:integration:redis` (enabled via `ENABLE_REDIS_INTEGRATION_TESTS=1`)
- Updated `README.md`:
  - documented Redis integration test command.
- Updated `docs/implementation-plan.md`:
  - marked Redis-backed integration testing for rate limiting as complete.
- Validation:
  - `npm run typecheck` passed
  - `npm test` passed (9 tests)
  - `npm run test:integration:redis` passed (2 tests)
  - `npm run build` passed

## 2026-05-21 - Iteration 26 (security model options shortlist)

- Re-checked relevant assignment controls before continuing research notes (`prompt-injection detection`, `PII redaction`).
- Updated `docs/research-matrix.md`:
  - added a shortlist of prompt-injection candidate models for later deep analysis:
    - Ollama-native `llama-guard3`
    - Hugging Face candidates (`Prompt-Guard 2`, `deberta-v3-base-prompt-injection-v2`, `prompt-injection-sentinel`)
  - added a dedicated shortlist section for PII/security detection options:
    - Microsoft Presidio
    - GLiNER
    - rule-only and hybrid alternatives
  - documented that detailed pros/cons benchmarking remains a separate follow-up pass.
- Updated `docs/implementation-plan.md`:
  - marked the "initial model shortlist recorded" research task complete.
