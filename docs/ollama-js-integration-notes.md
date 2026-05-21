# Ollama JS SDK integration notes

This document captures implementation-facing research for using the `ollama` JavaScript SDK as the prompt-injection detection engine.

## Official references

- Ollama JS SDK repository: <https://github.com/ollama/ollama-js>
- Ollama platform docs: <https://ollama.com>

## Integration shape for this gateway

- Use `Ollama` client in-process for detector calls.
- Default host is local Ollama (`http://127.0.0.1:11434`).
- Keep detector invocation isolated behind a single service interface so sidecar migration stays possible.

## SDK constraints to design around

- Streaming:
  - SDK supports streaming, but detector path should use non-streaming responses for deterministic control flow.
- Abort behavior:
  - `abort()` cancels all streams on the client instance.
  - recommendation: one client instance per stream if streams are ever introduced.
- Host/auth flexibility:
  - SDK supports custom `host` and `headers`, enabling local or cloud-backed operation.
- Runtime options:
  - `keep_alive` can reduce latency from model reload churn.
  - model-specific options must be treated as non-portable configuration.

## Required guardrails

- Hard timeout per detector call with explicit fallback behavior.
- Strict output schema (structured classification result).
- Fail-closed vs fail-open policy must be explicit and auditable.
- Correlation IDs must flow through detector requests and audit records.
- Dedicated metrics: detector latency, timeout rate, block rate, fallback rate.

## Recommended fallback policy (initial)

- If detector times out or errors:
  - mark request as `error` in audit context,
  - apply conservative rule-based checks,
  - return blocked response only when deterministic high-confidence threat signals are present.
- Keep policy configurable so stricter fail-closed mode can be enabled for higher-risk tenants.

## Data needed before locking model/runtime defaults

- Throughput vs latency benchmark under expected concurrency.
- False-positive/false-negative rates on corpus + obfuscation variants.
- Resource profile (CPU/RAM) for selected model on deployment target.
