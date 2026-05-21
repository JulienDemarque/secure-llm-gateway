# Detection approach comparison

## Options

1. Ollama sidecar process (gateway calls local sidecar over HTTP)
2. Ollama JS SDK in-process (`ollama` package) with local classifier orchestration

## Trade-offs

### Ollama sidecar

- Pros
  - Process isolation from app runtime
  - Independent model lifecycle and scaling
  - Easier shared usage across multiple services
- Cons
  - More infra complexity (service management, networking, health checks)
  - Extra cross-process latency
  - More moving parts in local dev and CI

### Ollama JS SDK + local classifier orchestration

- Pros
  - Simpler integration path in Node code
  - Cleaner test seams in app-level unit/integration tests
  - Faster iteration during development
- Cons
  - Tighter coupling between gateway and inference behavior
  - Resource contention risk in app process context
  - Requires careful timeout and fallback controls

## Current recommendation

- Prefer Ollama JS SDK + local classifier orchestration first, with strict guardrails:
  - hard timeouts
  - deterministic fallback decision policy
  - explicit audit reasons
- Keep sidecar path as fallback if scaling/isolation needs dominate later.

## Implementation guardrails (required either way)

- Time budget
  - enforce per-request detector timeout (target configurable; initial planning target 200-600ms p95).
- Fallback policy
  - on timeout/error, apply deterministic backup checks and emit explicit audit reason.
- Isolation of detector contract
  - expose a single internal detector interface so switching from in-process to sidecar does not affect route/middleware signatures.
- Observability
  - track latency, timeout/error rate, fallback rate, and classification distribution.
- Safety posture
  - never trust detector output without schema validation and normalization.

## Missing data before final lock

- p95 latency impact under expected request volume
- false-positive and false-negative rates on corpus + variations
- memory and CPU profile for target deployment shape
- model load/warmup behavior and effect of `keep_alive`
- acceptable fallback behavior per risk tier (default tenant vs high-risk tenant)
