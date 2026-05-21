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

## Missing data before final lock

- p95 latency impact under expected request volume
- false-positive and false-negative rates on corpus + variations
- memory and CPU profile for target deployment shape
