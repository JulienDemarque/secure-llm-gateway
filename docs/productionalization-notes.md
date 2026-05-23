# Productionalization notes

Covers post-assignment hardening and scale priorities while keeping assignment scope focused.

## 1) Detector runtime evolution

- Assignment default: in-process Ollama JS SDK detector.
- Scale path: move detector to dedicated sidecar service.
- Production performance requirement: run detector with GPU acceleration (or adopt smaller/faster guard model with strict timeout policy) to avoid high p95/p99 latency from CPU-only inference.
- Why sidecar at scale:
  - isolate memory/CPU pressure from API process
  - independent scaling and rollout of detection models
  - cleaner SLO control for gateway latency

## 2) Performance and load testing

- Add baseline load tests for:
  - `/v1/chat` happy path
  - `/v1/chat` blocked path
  - detector timeout/fallback path
- Track:
  - p50/p95/p99 latency
  - timeout rate
  - fallback rate
  - resource usage (CPU/memory)

## 3) Operational hardening

- Add request queue/backpressure strategy under detector overload.
- Add circuit breaker around detector dependency.
- Add per-tenant policy controls (strict fail-closed vs balanced fallback).
- Add canary rollout for detector model/prompt changes.

## 4) Security and compliance growth

- Expand secret scanning to include pre-receive/CI enforcement only (not just local hooks).
- Add red-team regression pack and periodic drift checks.
- Formalize audit retention and access controls for redaction reversal data.
- Harden Mongo deployment authentication:
  - local convenience setup may run Mongo without auth, but production must require credentials.
  - configure DB users/roles, strong secrets, and least-privilege app account.
  - enforce network isolation and disable public exposure of database ports.

## 5) Recommended order after assignment baseline

1. Establish reproducible load tests and SLO targets.
2. Introduce sidecar detector behind existing detector interface.
3. Add resilience controls (breaker, queueing, retries with limits).
4. Add rollout controls and model/version governance.
