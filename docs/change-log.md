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
