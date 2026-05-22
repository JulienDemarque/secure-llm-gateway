# Implementation checklist

## Scope

- [ ] Build a secure gateway with layered controls while treating prompt corpora as untrusted test assets.
- [ ] For every iteration, re-check `docs/original-assignment.md` and update this implementation checklist.

## Phased checklist

### Phase 0: environment and requirement preflight

- [x] Re-validate assignment requirements against `docs/original-assignment.md`.
- [x] Verify local toolchain availability (`node`, `npm`, `docker`, `docker compose`, `gitleaks`).
- [x] Create requirement traceability document.
- [x] Add `.gitleaks.toml` (or equivalent) and define scan commands.
- [x] Define CI baseline checks (secret scan + tests on push/PR).
- [x] Define pre-commit baseline checks (secret scan + fast quality gate).
- [x] Add pre-commit hook scaffold for local secret scanning.

### Phase 1: safety scaffolding

- [x] Add `test-prompts/` to `.gitignore`.
- [x] Add `test-prompts/` to `.claudeignore`.
- [x] Add `test-prompts/` to `.cursorignore`.
- [x] Add Cursor rules for safe small-step iteration and untrusted corpus handling.
- [x] Add contributor guidance for safe corpus handling in repo documentation.
- [x] Add code-commenting convention rule (concise JSDoc on exported/non-obvious functions).

### Phase 2: research-first decisions (highest priority)

- [x] Create research matrix document.
- [x] Record initial shortlist of prompt-injection and PII/security model options for later deep comparison.
- [x] Complete first-pass deep comparison criteria and pros/cons across shortlisted prompt-injection and PII options.
- [x] Decide next-step PII implementation approach (Node deterministic baseline now, Presidio sidecar as later enhancement).
- [ ] Research tools and best practices (official docs, alternatives, recommendation).
- [x] Evaluate provider-agnostic abstraction options (LiteLLM vs LangChain) for gateway call path.
- [ ] Evaluate LangSmith fit for observability/tracing and decide if it is in-scope or production follow-up.
- [ ] Research repo architecture options (official docs, alternatives, recommendation).
- [ ] Research testing strategy options (official docs, alternatives, recommendation).
- [ ] Research security controls and standards (official docs, alternatives, recommendation).
- [ ] Record final recommendations with rationale.

### Phase 3: architecture baseline

- [x] Create technical architecture outline document.
- [x] Bootstrap minimal Node.js API placeholder with required routes.
- [x] Replace `/v1/chat` placeholder with a live LiteLLM-backed provider call path.
- [x] Align `/v1/chat` to LiteLLM SDK-in-app mode (no LiteLLM proxy runtime requirement).
- [x] Document auth architecture details (flow, data model, roles, responses, tests) for review.
- [x] Decide persistence library (`mongoose`) and document Mongo/Redis schema outline.
- [x] Document PII redaction encryption/decryption design and required env secrets.
- [x] Add function-level code comments across current implementation modules.
- [x] Add minimal OpenAPI/Swagger docs for manual endpoint validation.
- [x] Improve Swagger default `/v1/chat` payload example for realistic manual testing.
- [x] Extend `/healthz` dependency reporting with Ollama detector readiness.
- [x] Add prompt-guard debug logging path for detector decision troubleshooting.
- [ ] Define request pipeline contract for `/v1/chat`.
- [ ] Freeze middleware boundaries and shared audit context contract.
- [ ] Define test strategy per control module and acceptance criteria.

### Phase 4: detection implementation strategy

- [x] Create detection approach comparison document.
- [x] Validate Ollama JS SDK + local classifier integration constraints.
- [x] Enforce structured detector output schema (Ollama `format` JSON schema + runtime validation).
- [x] Include canonical `ruleId`/`owaspCategory` in detector output for "rule that fired" auditability.
- [x] Enforce decision coherence (`blocked=false` only when no injection signal; fail-safe block on contradictions).
- [x] Simplify detector output: LLM returns `ruleId` only; service derives OWASP category in code.
- [x] Improve detector prompt with per-rule descriptors + disambiguation guidance to reduce overuse of `INJ-A1`.
- [x] Narrow detector scope prompt to injection behavior only (exclude standalone user-provided PII from blocking).
- [x] Link audit and PII token records via shared per-request `correlationId`.
- [ ] Define detector timeout/fallback policy and audit semantics.
- [ ] Define benchmark plan (latency, false positives, false negatives).

### Phase 5: full control implementation

- [x] Implement authentication module and tests.
- [x] Implement rate limiting module and tests.
- [x] Add Redis-backed integration tests for rate limiting behavior.
- [x] Add initial model-assisted prompt-injection guard middleware with structured JSON detector output.
- [x] Implement prompt-injection detection module and tests.
- [x] Implement deterministic PII redaction module and tests (email, phone, Israeli ID + reversible token storage).
- [ ] Implement output validation module and tests.
- [x] Implement audit logging and retrieval path.
- [x] Add admin audit-time original request reconstruction (`includeOriginal=true`) from encrypted redaction tokens.

### Phase 6: hardening and release readiness

- [x] Add `Dockerfile` and `docker-compose.yml` for API + Mongo + Redis.
- [x] Add internal-only Docker Compose Ollama service for local prompt guard runtime.
- [x] Add Docker Compose hot-reload API dev service (`api-dev` with `tsx watch`).
- [x] Validate Docker startup and Mongo seeding flow end-to-end.
- [x] Document production Mongo authentication hardening note.
- [ ] Add secret scanning configuration and CI check.
- [x] Add TypeScript typecheck to pre-commit hook checks.
- [ ] Activate pre-commit hook in local git environment.
- [ ] Add adversarial test variations and regression suite.
- [ ] Document known limitations and operational runbook.
- [ ] Final end-to-end validation against assignment acceptance criteria.
