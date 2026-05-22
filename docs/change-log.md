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

## 2026-05-21 - Iteration 27 (deep model comparison pass)

- Re-checked assignment control requirements before expanding research (`prompt-injection detection`, `PII redaction`).
- Expanded `docs/research-matrix.md` with first-pass deep comparisons:
  - added explicit evaluation criteria for prompt-injection options (quality, FP risk, latency, integration complexity, ops burden).
  - added option-by-option pros/cons and fit notes for:
    - `llama-guard3`
    - `Prompt-Guard 2`
    - `deberta-v3-base-prompt-injection-v2`
    - `prompt-injection-sentinel`
  - added explicit evaluation criteria for PII/security options.
  - added option-by-option pros/cons and fit notes for:
    - deterministic rules
    - Microsoft Presidio
    - GLiNER
    - hybrid strategy
  - refined recommendation: deterministic baseline for required categories first, then hybrid extension.
- Updated `docs/implementation-plan.md`:
  - marked the deep comparison pass task complete under Phase 2.

## 2026-05-21 - Iteration 28 (LiteLLM call path + pre-commit typecheck)

- Re-checked assignment integration requirements before implementation:
  - `/v1/chat` must perform a real provider call when key is present.
  - service should return clear `503` when provider token is missing.
- Added provider abstraction + LiteLLM adapter:
  - `src/domain/llm.ts` defines provider client contract.
  - `src/providers/litellm-client.ts` adds LiteLLM-compatible `/chat/completions` HTTP client with timeout support.
- Updated `src/app.ts`:
  - injected `llmClient` through `createApp` options for testability.
  - replaced `/v1/chat` `501` placeholder with real LiteLLM-backed call.
  - added `502 provider-request-failed` response on upstream failure.
  - expanded provider readiness check to include `LITELLM_API_KEY`.
- Updated tests to stay deterministic and network-free:
  - `src/app.auth.test.ts`
  - `src/app.rate-limit.test.ts`
  - `src/app.rate-limit.redis.integration.test.ts`
  - each now injects a fake LLM client and asserts `200` on allowed `/v1/chat` calls.
- Updated API/docs:
  - `src/docs/openapi.ts` now documents `/v1/chat` `200` and `502` responses.
  - `README.md` now documents LiteLLM env vars and current pre-commit checks.
- Updated pre-commit hook:
  - `.githooks/pre-commit` now runs both gitleaks and `npm run typecheck`.
- Updated `docs/implementation-plan.md`:
  - marked provider-abstraction decision complete (`LiteLLM` path selected).
  - marked live LiteLLM call path task complete.
  - marked pre-commit TypeScript check addition complete.

## 2026-05-21 - Iteration 29 (LiteLLM Docker env passthrough fix)

- Diagnosed `/v1/chat` runtime `provider-request-failed` with `fetch failed` in Docker:
  - API container defaulted to `http://localhost:4000` for LiteLLM.
  - no LiteLLM service was bound inside the API container namespace.
- Updated `docker-compose.yml`:
  - added `LITELLM_BASE_URL`, `LITELLM_TIMEOUT_MS`, and `LITELLM_API_KEY` passthrough to the `api` service env.
- Updated `README.md`:
  - added troubleshooting note to set `LITELLM_BASE_URL=https://api.openai.com/v1` when no local LiteLLM proxy is running yet.
- Updated `docs/implementation-plan.md`:
  - marked Docker Compose LiteLLM env passthrough task complete.

## 2026-05-21 - Iteration 30 (LiteLLM SDK alignment for Node)

- Re-checked LiteLLM documentation paths and aligned implementation to SDK-in-app usage for this Node codebase.
- Added dependency:
  - `litellm` package in `package.json`.
- Updated `src/providers/litellm-client.ts`:
  - replaced proxy-style HTTP fetch logic with LiteLLM SDK `completion()` call.
  - removed proxy-only base URL/timeout/token handling from this adapter.
- Updated `src/app.ts`:
  - provider readiness now checks provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) only.
  - clarified 503 configuration message accordingly.
- Updated `docker-compose.yml`:
  - removed LiteLLM proxy env passthrough variables previously added (`LITELLM_BASE_URL`, `LITELLM_TIMEOUT_MS`, `LITELLM_API_KEY`).
- Updated `README.md`:
  - replaced proxy configuration guidance with LiteLLM SDK env guidance.
- Updated `docs/implementation-plan.md`:
  - replaced proxy-env task wording with SDK-alignment task wording.

## 2026-05-21 - Iteration 31 (Swagger chat example quality update)

- Updated `src/docs/openapi.ts` for better Swagger "Try it out" defaults on `/v1/chat`:
  - added role enum alignment with runtime validation (`system`, `user`, `assistant`).
  - added `content` minimum length metadata.
  - added realistic request example payload:
    - model `gpt-4o`
    - meaningful system/user messages
    - `max_tokens: 256` instead of minimal value.
- Updated `docs/implementation-plan.md`:
  - marked Swagger default chat example improvement as complete.

## 2026-05-21 - Iteration 32 (model-assisted prompt-injection guard baseline)

- Implemented model-assisted prompt-injection detection path (structured output, no hardcoded-only detector):
  - added `src/domain/prompt-injection.ts` with detector contract and normalized result shape.
  - added `src/detectors/generic-llm-prompt-injection-detector.ts` using LiteLLM `completion()` with JSON-only classification prompt.
  - added `src/middleware/detect-prompt-injection.ts` to enforce pre-provider blocking.
- Wired middleware into `/v1/chat` chain in `src/app.ts`:
  - route order now includes prompt-injection detection before provider execution.
  - returns `400` on detection with category/confidence/rationale payload.
  - returns `502` on detector runtime failure.
- Added tests for prompt guard behavior:
  - new `src/app.prompt-injection.test.ts` covering allow, block, and detector-failure scenarios.
  - updated existing auth/rate-limit tests to inject an allow detector stub and remain network-free.
  - updated `package.json` test scripts to include prompt-injection tests.
- Updated docs:
  - `src/docs/openapi.ts` response descriptions now include detection-block and detector/provider failure semantics.
  - `README.md` current-controls section now reflects LiteLLM SDK call path + model-assisted prompt-injection guard.
  - `docs/implementation-plan.md` now tracks this baseline guard milestone as completed.

## 2026-05-21 - Iteration 33 (switch prompt guard to local Ollama)

- Re-aligned prompt-injection detector runtime to local model execution:
  - updated `src/detectors/generic-llm-prompt-injection-detector.ts` to use Ollama JS SDK (`ollama` package) instead of LiteLLM for detector calls.
  - detector now defaults to:
    - `OLLAMA_HOST=http://127.0.0.1:11434`
    - `PROMPT_GUARD_MODEL=llama-guard3`
  - retained structured JSON output contract and parser behavior.
- Added dependency:
  - installed `ollama` package.
- Updated runtime configuration docs:
  - `README.md` now includes "Prompt guard configuration (local Ollama)" with Docker host guidance (`host.docker.internal`).
- Updated Docker compose passthrough:
  - `docker-compose.yml` now forwards `OLLAMA_HOST` and `PROMPT_GUARD_MODEL` into API container.
- Updated `docs/implementation-plan.md`:
  - marked "Validate Ollama JS SDK + local classifier integration constraints" as complete.

## 2026-05-21 - Iteration 34 (Compose-managed internal Ollama service)

- Updated `docker-compose.yml` to run Ollama as an internal service:
  - added `ollama` service (`ollama/ollama:latest`) with persistent `ollama_data` volume.
  - exposed port `11434` only inside Compose network (`expose`, no host `ports` mapping).
  - added Ollama healthcheck (`ollama list`).
  - updated API default `OLLAMA_HOST` to `http://ollama:11434`.
  - added API dependency on healthy `ollama` service.
- Updated `README.md`:
  - Docker section now states stack includes Ollama.
  - added command to pull prompt-guard model in-container: `docker compose exec ollama ollama pull llama-guard3`.
  - documented that Ollama is internal-only by default in Compose.
- Updated `docs/implementation-plan.md`:
  - marked internal-only Docker Compose Ollama service task as complete.

## 2026-05-21 - Iteration 35 (healthz includes Ollama readiness)

- Added Ollama health helper:
  - created `src/db/ollama.ts` with lightweight `GET /api/version` probe and timeout-based `ready/not-ready` status.
- Updated `src/app.ts`:
  - `/healthz` is now async and includes `dependencies.ollama`.
  - health payload now reports `mongo`, `redis`, `ollama`, and provider readiness.
- Updated `README.md`:
  - documented that `/healthz` now includes Ollama dependency status.
- Updated `docs/implementation-plan.md`:
  - marked Ollama health reporting task complete.

## 2026-05-21 - Iteration 36 (generic guard model + strict structured output validation)

- Updated prompt-injection detector to better align with generic-model strategy:
  - changed default `PROMPT_GUARD_MODEL` from `llama-guard3` to `llama3.1:8b`.
- Hardened structured-output enforcement in `src/detectors/generic-llm-prompt-injection-detector.ts`:
  - switched Ollama `chat` call from `format: "json"` to explicit JSON schema object in `format`.
  - added strict runtime validation with `zod` to ensure output matches expected shape exactly.
  - added rationale sanitization/truncation to reduce risk from unsafe model output content.
  - changed invalid/empty detector output behavior to error (blocked by middleware `502`) instead of silent allow.
- Added dependency:
  - installed `zod` for runtime schema validation.
- Updated docs:
  - `README.md` now documents default guard model as `llama3.1:8b`.
  - Docker pull command updated to `docker compose exec ollama ollama pull llama3.1:8b`.
  - `docs/implementation-plan.md` now marks structured detector output schema enforcement as completed.

## 2026-05-21 - Iteration 37 (fix empty guard model env causing detector failure)

- Fixed detector runtime bug where empty `PROMPT_GUARD_MODEL` produced Ollama error `model is required`:
  - updated `src/detectors/generic-llm-prompt-injection-detector.ts` to treat unset/empty/whitespace env values as missing and fall back to defaults.
  - applied this fallback logic to both `PROMPT_GUARD_MODEL` and `OLLAMA_HOST`.
- Updated `docker-compose.yml`:
  - changed default API env passthrough for `PROMPT_GUARD_MODEL` to `llama3.1:8b` instead of empty string.

## 2026-05-21 - Iteration 38 (detector emits explicit "rule that fired")

- Updated prompt-injection detector contract in `src/domain/prompt-injection.ts`:
  - added canonical `ruleId` field (`INJ-*`, `INJ-UNKNOWN`, `NONE`).
  - added `owaspCategory` field (`LLM01`, `LLM02`, `LLM06`, `NONE`, `UNKNOWN`).
- Updated `src/detectors/generic-llm-prompt-injection-detector.ts`:
  - expanded Ollama structured `format` schema to require `ruleId` and `owaspCategory`.
  - expanded runtime `zod` validation to enforce these fields.
  - updated classification prompt to map detections to the provided corpus rules (`INJ-A1`..`INJ-E3`) and OWASP categories.
- Updated `src/middleware/detect-prompt-injection.ts`:
  - block responses now include `ruleId` and `owaspCategory` to expose the fired rule in API behavior.
- Updated tests:
  - refreshed detector stubs in auth/rate-limit suites to include new required fields.
  - updated prompt-injection tests to assert `ruleId` and `owaspCategory` in blocked responses.
- Updated `docs/implementation-plan.md`:
  - marked detector rule-id/OWASP tagging milestone complete.

## 2026-05-22 - Iteration 39 (prompt guard debug visibility + API-only logs)

- Added detector decision debug logging in `src/middleware/detect-prompt-injection.ts`:
  - new `PROMPT_GUARD_DEBUG=1` mode logs detector decisions (`blocked`, `ruleId`, `owaspCategory`, `category`, `confidence`, `rationale`).
  - detector runtime errors are also logged in debug mode.
- Updated `README.md`:
  - documented `PROMPT_GUARD_DEBUG`.
  - added API-only Docker logs command: `docker compose logs -f --tail=200 api`.
- Updated `docs/implementation-plan.md`:
  - marked prompt-guard troubleshooting/logging support as complete.

## 2026-05-22 - Iteration 40 (Docker hot-reload API service)

- Added `api-dev` service in `docker-compose.yml` for containerized hot reload:
  - build target: `Dockerfile` `build` stage (includes dev dependencies).
  - runtime command: `npm run dev` (`tsx watch`).
  - bind mounts project source plus dedicated `api_dev_node_modules` volume.
  - profile-gated (`dev`) to avoid interfering with default `api` service.
  - wired same env and dependency health conditions as `api`.
- Added `docker:up:dev` script in `package.json`:
  - `docker compose --profile dev up -d --build api-dev`
- Updated `README.md`:
  - documented hot-reload Docker startup command.
  - documented `api-dev` logs command for dev mode.
- Updated `docs/implementation-plan.md`:
  - marked Docker Compose hot-reload dev service task complete.

## 2026-05-22 - Iteration 41 (detector decision coherence hardening)

- Tightened prompt-injection detector consistency in `src/detectors/generic-llm-prompt-injection-detector.ts`:
  - expanded structured JSON schema with coherence constraints for `blocked=false` outputs.
  - expanded runtime `zod` validation with cross-field checks:
    - when `blocked=false`, require `ruleId=NONE`, `owaspCategory=NONE`, `category=unknown`, `confidence=0`.
  - strengthened system prompt to explicitly require:
    - any recognized injection signal => `blocked=true`
    - nearest corpus `ruleId` selection (`INJ-A1..INJ-E3`, fallback `INJ-UNKNOWN`).
- Added fail-safe normalization:
  - if model returns contradictory output (`blocked=false` with injection signals), code coerces it to a blocking decision before final validation.
- Updated `docs/implementation-plan.md`:
  - marked detector decision coherence hardening task complete.

## 2026-05-22 - Iteration 42 (ruleId-only detector output simplification)

- Simplified prompt-injection detector contract to reduce model confusion:
  - removed `category` from `PromptInjectionDetectionResult`.
  - detector now treats `ruleId` as the primary model classification signal.
- Updated `src/detectors/generic-llm-prompt-injection-detector.ts`:
  - removed `owaspCategory` and `category` from model-required JSON schema.
  - prompt now requests nearest `ruleId` only (plus `blocked`, `confidence`, `rationale`).
  - OWASP category is now derived deterministically in code from `ruleId`.
  - kept fail-safe normalization for contradictory outputs.
- Updated `src/middleware/detect-prompt-injection.ts`:
  - removed `category` from debug logs and 400 block response payload.
- Updated tests:
  - removed `category` from detector stubs and assertions in:
    - `src/app.auth.test.ts`
    - `src/app.rate-limit.test.ts`
    - `src/app.rate-limit.redis.integration.test.ts`
    - `src/app.prompt-injection.test.ts`
- Updated `docs/implementation-plan.md`:
  - marked ruleId-only detector output simplification complete.

## 2026-05-22 - Iteration 43 (rule disambiguation prompt tuning)

- Updated `src/detectors/generic-llm-prompt-injection-detector.ts` prompt content to improve rule selection quality:
  - added concise, non-payload descriptors for each `INJ-*` rule.
  - added disambiguation priority guidance to reduce defaulting to `INJ-A1`.
  - explicitly instructs classifier to prefer the most specific matching rule and use `INJ-UNKNOWN` only when no confident mapping exists.
- Updated `docs/implementation-plan.md`:
  - marked detector disambiguation prompt refinement complete.

## 2026-05-22 - Iteration 44 (per-request audit logging + /v1/audit retrieval)

- Implemented audit domain/model/repository foundations:
  - added `src/domain/audit.ts` (record shape, status, repository interface).
  - added `src/models/audit-log.ts` (`audit_logs` Mongo schema/model).
  - added `src/repositories/mongo-audit-log-repository.ts`.
  - added `src/repositories/noop-audit-log-repository.ts` for isolated test contexts.
- Wired per-request audit capture for `/v1/chat` in `src/app.ts`:
  - added request/response hashing (`sha256` base64).
  - logs one record per request with status mapping (`allowed`/`blocked`/`error`), latency, API key id, model, and detector threat metadata.
  - write path is non-blocking and failure-tolerant (logs write failures without breaking API responses).
- Implemented admin retrieval endpoint:
  - `/v1/audit` now returns persisted entries (replacing previous `501` placeholder).
  - supports `since` (ISO timestamp) and `limit` (1..500, default 100) validation.
- Propagated detector result to request context:
  - extended Express request typing with `promptDetectionResult`.
  - detector middleware now stores the latest detection result on request for audit use.
- Updated tests and scripts:
  - added `src/app.audit.test.ts` covering allowed/blocked/error logging and admin retrieval.
  - updated existing auth/rate-limit/prompt tests to inject `NoopAuditLogRepository`.
  - updated `package.json` test scripts to include audit test suite.
- Updated API/docs:
  - `src/docs/openapi.ts` now documents `/v1/audit` `200` path + query params and `400` validation response.
  - `README.md` now includes audit logging behavior and example admin audit query command.
- Updated `docs/implementation-plan.md`:
  - marked audit logging and retrieval path as completed.

## 2026-05-22 - Iteration 45 (PII research refresh + implementation pick)

- Ran focused PII research refresh for middleware decision:
  - reviewed Presidio concepts, supported entities, and custom recognizer docs.
- Updated `docs/research-matrix.md`:
  - added a dedicated "what to implement next for PII middleware" section.
  - captured findings on Presidio’s Python/sidecar integration model and custom recognizer extensibility.
  - documented concrete recommendation:
    - implement deterministic Node baseline now for required categories (email, phone IL+intl, Israeli national ID) with reversible tokens,
    - keep Presidio sidecar as a later enhancement for broader entity coverage.
- Updated `docs/implementation-plan.md`:
  - marked the PII implementation approach decision task complete.

## 2026-05-22 - Iteration 46 (PII checksum references + deterministic redaction implementation)

- Updated `docs/research-matrix.md`:
  - added explicit Israeli ID checksum references used for deterministic validation:
    - `python-stdnum` docs (`stdnum.il.idnr`)
    - `python-stdnum` source implementation (`stdnum/il/idnr.py`)
- Implemented deterministic inbound PII redaction pipeline:
  - added `src/domain/pii.ts` (PII category + redaction token repository contract).
  - added `src/security/pii-crypto.ts` (AES-256-GCM encryption with env-based key loading).
  - added `src/models/redaction-token.ts` (`redaction_tokens` Mongo model).
  - added `src/repositories/mongo-redaction-token-repository.ts`.
  - added `src/repositories/noop-redaction-token-repository.ts`.
  - added `src/middleware/redact-inbound-pii.ts`:
    - deterministic detection/redaction for email, phone (IL+intl), and Israeli national ID.
    - Israeli ID checksum validation before redaction.
    - tokenized replacement (`[PII_<CATEGORY>:<token>]`) and reversible mapping persistence.
    - fail-closed behavior (`500 pii-redaction-unavailable`) if encryption key material is missing and PII must be redacted.
- Wired middleware into `/v1/chat` request path in `src/app.ts`:
  - executes after prompt-injection detection and before provider call.
  - `createApp` now supports `redactionTokenRepository` injection for testability.
- Added tests:
  - new `src/app.pii.test.ts` covering:
    - multi-category redaction before provider call,
    - no-op behavior for non-PII content,
    - fail-closed behavior for missing encryption key material.
  - updated `package.json` test scripts to include the new suite.
- Updated docs:
  - `README.md` now documents PII control status and required encryption env vars.
  - `src/docs/openapi.ts` now documents `500` for PII redaction failure.
  - `docs/implementation-plan.md` now marks deterministic PII redaction implementation as complete.

## 2026-05-22 - Iteration 47 (prompt-injection scope sensitivity tuning)

- Tuned detector prompt guidance in `src/detectors/generic-llm-prompt-injection-detector.ts` to reduce false positives from plain PII-bearing user content:
  - clarified `INJ-B3` as requests to reveal hidden/system secrets (not merely presence of user-provided sensitive values).
  - added explicit scope guard: standalone user-provided PII is out of scope for prompt-injection classifier and handled by PII redaction middleware.
  - reinforced "detect prompt-injection behavior only" in system instruction.
- Updated `docs/implementation-plan.md`:
  - marked detector scope-narrowing prompt refinement complete.

## 2026-05-22 - Iteration 48 (explicit audit-token linkage via correlationId)

- Implemented deterministic linkage between `audit_logs` and `redaction_tokens`:
  - added per-request `correlationId` generation in `/v1/chat` path (`src/app.ts`).
  - stored `correlationId` on audit entries and redaction token entries.
- Updated domain/models/repositories:
  - `src/domain/audit.ts`: added `correlationId` to `AuditLogRecord`.
  - `src/domain/pii.ts`: added `correlationId` to `RedactionTokenRecord`.
  - `src/models/audit-log.ts`: added indexed `correlationId` field.
  - `src/models/redaction-token.ts`: added indexed `correlationId` field.
  - `src/repositories/mongo-audit-log-repository.ts`: now returns `correlationId` in query results.
- Updated request typing and middleware plumbing:
  - `src/types/express.d.ts`: added `Request.correlationId`.
  - `src/middleware/redact-inbound-pii.ts`: persists `correlationId` with each token mapping.
- Updated docs:
  - `README.md` now notes correlation-based deterministic linkage.
  - `docs/implementation-plan.md` marks correlation linkage task complete.
