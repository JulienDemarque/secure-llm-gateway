# Implementation checklist

## Scope

- [ ] Build a secure gateway with layered controls while treating prompt corpora as untrusted test assets.

## Phased checklist

### Phase 1: safety scaffolding

- [x] Add `test-prompts/` to `.gitignore`.
- [x] Add `test-prompts/` to `.claudeignore`.
- [ ] Add `test-prompts/` to `.cursorignore`.
- [x] Add Cursor rules for safe small-step iteration and untrusted corpus handling.
- [ ] Add contributor guidance for safe corpus handling in repo documentation.

### Phase 2: research-first decisions (highest priority)

- [x] Create research matrix document.
- [ ] Research tools and best practices (official docs, alternatives, recommendation).
- [ ] Research repo architecture options (official docs, alternatives, recommendation).
- [ ] Research testing strategy options (official docs, alternatives, recommendation).
- [ ] Research security controls and standards (official docs, alternatives, recommendation).
- [ ] Record final recommendations with rationale.

### Phase 3: architecture baseline

- [x] Create technical architecture outline document.
- [ ] Define request pipeline contract for `/v1/chat`.
- [ ] Freeze middleware boundaries and shared audit context contract.
- [ ] Define test strategy per control module and acceptance criteria.

### Phase 4: detection implementation strategy

- [x] Create detection approach comparison document.
- [ ] Validate Ollama JS SDK + local classifier integration constraints.
- [ ] Define detector timeout/fallback policy and audit semantics.
- [ ] Define benchmark plan (latency, false positives, false negatives).

### Phase 5: full control implementation

- [ ] Implement authentication module and tests.
- [ ] Implement rate limiting module and tests.
- [ ] Implement prompt-injection detection module and tests.
- [ ] Implement PII redaction module and tests.
- [ ] Implement output validation module and tests.
- [ ] Implement audit logging and retrieval path.

### Phase 6: hardening and release readiness

- [ ] Add secret scanning configuration and CI check.
- [ ] Add adversarial test variations and regression suite.
- [ ] Document known limitations and operational runbook.
- [ ] Final end-to-end validation against assignment acceptance criteria.
