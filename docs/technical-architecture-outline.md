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
- `createdBy`: string (optional bootstrap marker: `seed` / `admin-tool`)

### Security notes

- Never store raw API keys in Mongo or logs.
- Never log `x-api-key` header value.
- Audit/log with `apiKeyId` and safe metadata only.
- Use HTTPS in deployment; API keys only in headers, not URLs.
- `timingSafeEqual` is necessary but not sufficient by itself; surrounding flow must also avoid timing leaks.

### Response behavior (implemented)

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

### API key provisioning (scope decision)

- Challenge scope does not require end-user auth or self-serve API key issuance.
- Initial keys should be provisioned via seed/bootstrap script into Mongo.
- Plaintext key is generated once, shown once to operator, and only hashed value is persisted.
- Future production extension can add an admin-authenticated key-management API.

## 6) Persistence stack decision (Mongo/Redis)

### Decision: choose Mongoose (not Prisma) for this challenge

- Assignment explicitly requires MongoDB + Redis and middleware-focused implementation speed.
- Mongoose fits direct Mongo document modeling, schema validation, indexes, and middleware hooks with minimal setup.
- Prisma Mongo adds extra constraints and mapping complexity (for example `_id` mapping and replica-set transaction assumptions) that are unnecessary for this challenge scope.
- Re-evaluate Prisma only if we later need a unified multi-database ORM layer.

### Persistence components

- MongoDB:
  - `api_keys` collection for authentication and per-key policy.
  - `audit_logs` collection for per-request security/audit records.
  - `redaction_tokens` collection for reversible PII mapping (audit path only).
- Redis:
  - sliding-window counters for per-key rate limiting.

## 7) Database schema outline

### Mongo collection: `api_keys`

- `_id`: ObjectId
- `keyHash`: string, unique index
- `role`: enum (`client`, `admin`)
- `status`: enum (`active`, `revoked`)
- `rateLimitPerMinute`: number (default 30)
- `label`: string (optional)
- `createdBy`: string (optional)
- `createdAt`: Date
- `lastUsedAt`: Date (best effort)

Indexes:

- unique index on `keyHash`
- index on `status`

### Mongo collection: `audit_logs`

- `_id`: ObjectId
- `timestamp`: Date
- `correlationId`: string
- `apiKeyId`: ObjectId | string
- `model`: string
- `requestHash`: string
- `responseHash`: string (nullable for blocked/error paths)
- `detectedThreats`: string[]
- `decision`: enum (`allowed`, `blocked`, `error`)
- `latencyMs`: number
- `httpStatus`: number
- `details`: object (control-specific metadata, sanitized)

Indexes:

- descending index on `timestamp`
- compound index on (`apiKeyId`, `timestamp`)
- index on `decision`

### Mongo collection: `redaction_tokens`

- `_id`: ObjectId
- `token`: string (unique)
- `ciphertext`: string (base64)
- `iv`: string (base64)
- `authTag`: string (base64)
- `keyId`: string
- `category`: enum (`email`, `phone`, `il_national_id`)
- `correlationId`: string
- `createdAt`: Date
- `expiresAt`: Date (TTL)

Indexes:

- unique index on `token`
- TTL index on `expiresAt`
- index on `correlationId`

### Redaction encryption/decryption design

- Yes, redaction stores the original removed value encrypted only.
- `token` is a random placeholder ID inserted into redacted text (for example `[PII_EMAIL:tok_ab12]`).
- The token itself is not secret; it is a lookup key into `redaction_tokens`.

Encryption at write time:

1. Generate token.
2. Encrypt original PII value using AES-256-GCM.
3. Store `ciphertext`, `iv` (random 12-byte), `authTag`, and `keyId` with the token record.
4. Replace original span in outbound prompt with tokenized placeholder.

Decryption at audit time:

1. Require admin-only audit access path.
2. Fetch token record by `token` (and optionally `correlationId` guard).
3. Resolve decryption key by `keyId`.
4. Decrypt using AES-256-GCM and verify `authTag`.
5. Return original value only in authorized audit response.

Environment key material:

- `PII_ENCRYPTION_KEY_B64` (required): base64-encoded 32-byte key for AES-256-GCM.
- `PII_ENCRYPTION_KEY_ID` (required): identifier stored in each token record.
- Never commit these values; keep in env/secret manager only.

### Redis key patterns

- `rl:{apiKeyId}:{windowEpoch}` -> integer counter
- expiry = window duration + small buffer

## 8) Data model outline

- API keys: hash, role, limits, status, metadata.
- Audit records: request hash, response hash, rule hits, timing, decision, correlation ID.
- Redaction map: token-to-original mapping with restricted audit-path access.

## 9) Observability and operations

- Structured logs with correlation ID.
- Health endpoint includes Mongo, Redis, and provider readiness.
- Metrics: block rate, false-positive review queue count, p95 latency by control.

## 10) Testing strategy

- Unit tests for each security control.
- Integration tests for full middleware pipeline.
- Adversarial tests from prompt corpus and variations.
- Regression tests for known bypasses.

## 11) Prioritized architecture follow-ups

Completed during assignment baseline:

1. ~~Research and decide detection integration mode.~~ → Ollama JS SDK in-process detector with structured JSON output.
2. ~~Decide provider abstraction layer.~~ → LiteLLM JS SDK in-app mode (no proxy runtime).
3. ~~Define audit schema and retention/PII policy.~~ → Mongo `audit_logs` + encrypted `redaction_tokens` with admin-only reversal.
4. ~~Define test fixture format for corpus-driven testing.~~ → `docs/test-prompts-guidelines.md` + adversarial eval suite.

Remaining post-assignment follow-ups:

1. Evaluate tracing/observability integration path (native logs/metrics vs optional LangSmith).
2. Freeze module interfaces and shared security context as explicit TypeScript contracts.
3. Define detector timeout/fallback policy and benchmark plan (latency, false positives, false negatives).
4. Define rollout safeguards (feature flags, shadow mode where needed).

## 12) External references used

- Assignment requirements: `docs/original-assignment.md`
- OWASP REST Security Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html>
- OWASP API Security Top 10 (2023): <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>
- Node.js `crypto.timingSafeEqual`: <https://nodejs.org/dist/latest/docs/api/crypto.html#cryptotimingsafeequala-b>
- Mongoose guide: <https://mongoosejs.com/docs/guide.html>
- Prisma MongoDB docs: <https://www.prisma.io/docs/orm/overview/databases/mongodb>
