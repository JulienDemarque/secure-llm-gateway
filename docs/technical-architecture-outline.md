# Technical architecture outline

## 1) Goals and non-goals

- Goals: enforce uniform security controls for all LLM traffic, provide auditable decisions, preserve operational simplicity.
- Non-goals: full jailbreak-proofing, advanced model alignment research, downstream app authorization models.

## 2) Trust boundaries

- Trusted: gateway code, config, secret manager env vars, internal audit storage.
- Untrusted: client payloads, prompt corpora, model output, third-party provider responses.

## 3) Request lifecycle (`POST /v1/chat`)

1. Authenticate API key and resolve role/policy.
2. Apply per-key rate limiting.
3. Run prompt-injection detection.
4. Redact inbound PII before provider call.
5. Call provider adapter.
6. Validate outbound content for leaks/replayed injection.
7. Persist structured audit event.
8. Return allowed response or block decision.

## 4) Core modules

- `auth`: API key validation and role gating.
- `rate-limit`: Redis sliding window policy.
- `injection-detection`: Ollama-based classifier pipeline.
- `pii-redaction`: reversible tokenized redaction.
- `output-validation`: secret/injection echo leak checks.
- `audit`: normalized security event storage.
- `provider`: OpenAI/Anthropic adapter with health signal.

## 5) Data model outline

- API keys: hash, role, limits, status, metadata.
- Audit records: request hash, response hash, rule hits, timing, decision, correlation ID.
- Redaction map: token-to-original mapping with restricted audit-path access.

## 6) Observability and operations

- Structured logs with correlation ID.
- Health endpoint includes Mongo, Redis, and provider readiness.
- Metrics: block rate, false-positive review queue count, p95 latency by control.

## 7) Testing strategy

- Unit tests for each security control.
- Integration tests for full middleware pipeline.
- Adversarial tests from prompt corpus and variations.
- Regression tests for known bypasses.

## 8) Prioritized architecture TODOs

1. Research and decide detection integration mode.
2. Freeze module interfaces and shared security context.
3. Define audit schema and retention/PII policy.
4. Define test fixture format for corpus-driven testing.
5. Define rollout safeguards (feature flags, shadow mode where needed).
