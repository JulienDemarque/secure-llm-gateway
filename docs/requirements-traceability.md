# Requirements traceability

This document maps assignment requirements from `docs/original-assignment.md` to planned artifacts and implementation checkpoints.

## Mandatory requirement mapping

- Endpoints (`POST /v1/chat`, `GET /v1/audit`, `GET /healthz`)
  - Planned in: `docs/technical-architecture-outline.md`
  - Status: planned, not implemented
- Independent security middleware controls
  - Planned in: `docs/technical-architecture-outline.md`, `docs/implementation-plan.md`
  - Status: planned, not implemented
- Prompt-injection detection with coverage of Appendix patterns and variations
  - Planned in: `docs/detection-approach-comparison.md`, `docs/research-matrix.md`
  - Status: planned, not implemented
- PII redaction (email, phone IL+intl, Israeli national ID), reversible via audit path
  - Planned in: `docs/technical-architecture-outline.md`
  - Status: planned, not implemented
- Output validation for secrets and echoed injection content
  - Planned in: `docs/technical-architecture-outline.md`
  - Status: planned, not implemented
- Audit logging requirements (hashes, latency, decision, detected threats)
  - Planned in: `docs/technical-architecture-outline.md`
  - Status: planned, not implemented
- Secrets handling: env vars only; include `.gitleaks.toml` or equivalent
  - Planned in: `docs/dev-environment-preflight.md`, `docs/implementation-plan.md`
  - Status: partial (tool available), config not yet added
- TypeScript with `strict: true`
  - Planned in: `docs/dev-environment-preflight.md`
  - Status: not started
- Unit tests for security controls
  - Planned in: `docs/implementation-plan.md`, `docs/technical-architecture-outline.md`
  - Status: not started
- Dockerfile + docker-compose service stack
  - Planned in: `docs/implementation-plan.md`, `docs/dev-environment-preflight.md`
  - Status: not started
- README sections (run instructions, env vars, control-by-control architecture, known limitations)
  - Planned in: `docs/implementation-plan.md`
  - Status: not started
- PROMPTS.md process evidence and first prompt traceability
  - Planned in: existing `PROMPTS.md`, process rules in `.cursor/rules/`
  - Status: in progress

## Gaps found in plan and now addressed

- Pre-coding environment readiness checks were implicit and are now explicit in `docs/dev-environment-preflight.md`.
- Requirement-to-plan verification was implicit and is now explicit in this traceability document.
- Secret scanning requirement (`.gitleaks.toml`) is now called out as a concrete pre-implementation item.
