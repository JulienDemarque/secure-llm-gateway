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
- [ ] Research tools and best practices (official docs, alternatives, recommendation).
- [ ] Research repo architecture options (official docs, alternatives, recommendation).
- [ ] Research testing strategy options (official docs, alternatives, recommendation).
- [ ] Research security controls and standards (official docs, alternatives, recommendation).
- [ ] Record final recommendations with rationale.

### Phase 3: architecture baseline

- [x] Create technical architecture outline document.
- [x] Bootstrap minimal Node.js API placeholder with required routes.
- [x] Document auth architecture details (flow, data model, roles, responses, tests) for review.
- [x] Decide persistence library (`mongoose`) and document Mongo/Redis schema outline.
- [x] Document PII redaction encryption/decryption design and required env secrets.
- [x] Add function-level code comments across current implementation modules.
- [ ] Define request pipeline contract for `/v1/chat`.
- [ ] Freeze middleware boundaries and shared audit context contract.
- [ ] Define test strategy per control module and acceptance criteria.

### Phase 4: detection implementation strategy

- [x] Create detection approach comparison document.
- [ ] Validate Ollama JS SDK + local classifier integration constraints.
- [ ] Define detector timeout/fallback policy and audit semantics.
- [ ] Define benchmark plan (latency, false positives, false negatives).

### Phase 5: full control implementation

- [x] Implement authentication module and tests.
- [ ] Implement rate limiting module and tests.
- [ ] Implement prompt-injection detection module and tests.
- [ ] Implement PII redaction module and tests.
- [ ] Implement output validation module and tests.
- [ ] Implement audit logging and retrieval path.

### Phase 6: hardening and release readiness

- [ ] Add secret scanning configuration and CI check.
- [ ] Activate pre-commit hook in local git environment.
- [ ] Add adversarial test variations and regression suite.
- [ ] Document known limitations and operational runbook.
- [ ] Final end-to-end validation against assignment acceptance criteria.
