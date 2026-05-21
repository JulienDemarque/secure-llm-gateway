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

## 5) Authentication design (for review)

### Goals from assignment

- Require valid `x-api-key` on protected endpoints.
- Store API keys hashed in Mongo.
- Support two roles: `client`, `admin`.
- Allow only `admin` role for `GET /v1/audit`.

### Middleware contract

- Middleware: `authenticateApiKey`
  - runs before rate-limit and other controls.
  - validates presence of `x-api-key`.
  - resolves key record and role.
  - attaches auth context to request (for downstream middleware/audit).
- Middleware: `requireAdmin`
  - used on `GET /v1/audit`.
  - returns `403` when role is not `admin`.

### Verification flow

1. Read `x-api-key` header.
2. If missing: return `401` with stable error payload.
3. Compute candidate hash (SHA-256) from presented key.
4. Lookup key record by hash in Mongo (indexed).
5. Verify key status is active.
6. Use constant-time compare (`crypto.timingSafeEqual`) for hash verification path.
7. Attach `authContext` to request:
   - `apiKeyId`
   - `role`
   - `rateLimitPerMinute`
8. Continue to next middleware.

### Data model (Mongo `api_keys`)

- `_id`: ObjectId
- `keyHash`: string (SHA-256 hex/base64; unique index)
- `role`: `client | admin`
- `status`: `active | revoked`
- `rateLimitPerMinute`: number (default 30)
- `createdAt`: Date
- `lastUsedAt`: Date (best effort update)
- `label`: string (optional operator label)

### Security notes

- Never store raw API keys in Mongo or logs.
- Never log `x-api-key` header value.
- Audit/log with `apiKeyId` and safe metadata only.
- Use HTTPS in deployment; API keys only in headers, not URLs.
- `timingSafeEqual` is necessary but not sufficient by itself; surrounding flow must also avoid timing leaks.

### Response behavior (placeholder target)

- `401 Unauthorized`: missing/invalid/revoked key.
- `403 Forbidden`: valid key without required role.
- `429 Too Many Requests`: rate-limit enforcement (next middleware).

### Test cases (auth module)

- Missing `x-api-key` returns `401`.
- Invalid key returns `401`.
- Revoked key returns `401`.
- Valid `client` key can access `/v1/chat`.
- Valid `client` key denied on `/v1/audit` with `403`.
- Valid `admin` key allowed on `/v1/audit`.
- Constant-time compare function handles equal-length hash buffers correctly.

## 6) Data model outline

- API keys: hash, role, limits, status, metadata.
- Audit records: request hash, response hash, rule hits, timing, decision, correlation ID.
- Redaction map: token-to-original mapping with restricted audit-path access.

## 7) Observability and operations

- Structured logs with correlation ID.
- Health endpoint includes Mongo, Redis, and provider readiness.
- Metrics: block rate, false-positive review queue count, p95 latency by control.

## 8) Testing strategy

- Unit tests for each security control.
- Integration tests for full middleware pipeline.
- Adversarial tests from prompt corpus and variations.
- Regression tests for known bypasses.

## 9) Prioritized architecture TODOs

1. Research and decide detection integration mode.
2. Freeze module interfaces and shared security context.
3. Define audit schema and retention/PII policy.
4. Define test fixture format for corpus-driven testing.
5. Define rollout safeguards (feature flags, shadow mode where needed).

## 10) External references used

- Assignment requirements: `docs/original-assignment.md`
- OWASP REST Security Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html>
- OWASP API Security Top 10 (2023): <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>
- Node.js `crypto.timingSafeEqual`: <https://nodejs.org/dist/latest/docs/api/crypto.html#cryptotimingsafeequala-b>
