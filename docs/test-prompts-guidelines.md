# Test prompts guidelines and contract

This document defines how `test-prompts/` should be formatted and used without risking accidental prompt-injection ingestion in assistant contexts.

## Purpose

- Store local prompt-injection corpus entries and adversarial mutations.
- Keep these assets out of default assistant context via ignore files.
- Provide a stable data contract so tests and tooling can load fixtures deterministically.

## Local folder layout

- `test-prompts/raw/`: original corpus entries and source fixtures.
- `test-prompts/variants/`: transformed variants (case, spacing, encoding, obfuscation).
- `test-prompts/expected-outcomes/`: optional exports/reports if needed by tooling.

## File format contract

Each dataset file should be JSON with this top-level shape:

```json
{
  "version": "1.0",
  "suite": "prompt-injection-raw",
  "description": "Short human-readable description",
  "cases": [
    {
      "id": "INJ-A1-raw-001",
      "sourceRef": "INJ-A1",
      "variant": "raw",
      "input": {
        "model": "gpt-4o",
        "messages": [
          { "role": "user", "content": "..." }
        ]
      },
      "expected": {
        "httpStatus": 400,
        "decision": "blocked",
        "ruleId": "INJ-A1",
        "owaspCategory": "LLM01",
        "mustRedactInboundPii": false,
        "mustBlockOutboundEcho": false
      },
      "notes": "Optional implementation hints"
    }
  ]
}
```

## Required fields

- Top-level:
  - `version`: contract version string (start with `1.0`).
  - `suite`: unique suite identifier.
  - `cases`: non-empty array.
- Per case:
  - `id`: unique string across all prompt files.
  - `sourceRef`: canonical reference (`INJ-*` or `PII-*`).
  - `variant`: one of `raw`, `case-variation`, `whitespace-variation`, `encoding-variation`, `obfuscation-variation`.
  - `input.model`: `gpt-4o` or `claude-3-5-sonnet`.
  - `input.messages`: at least one `{ role, content }` item.
  - `expected.httpStatus`: expected API status.
  - `expected.decision`: `allowed` | `blocked` | `error`.

## Conditional expected fields

- For injection cases (`sourceRef` starts with `INJ-`):
  - include `expected.ruleId` and `expected.owaspCategory`.
- For PII cases (`sourceRef` starts with `PII-`):
  - include `expected.mustRedactInboundPii: true`.
- For outbound replay checks:
  - include `expected.mustBlockOutboundEcho: true` when response-echo blocking is required.

## Naming convention

- File name format:
  - `<suite>.<kind>.v<major>.json`
- Examples:
  - `prompt-injection.raw.v1.json`
  - `prompt-injection.variants.v1.json`
  - `pii.raw.v1.json`

## Validation rules

- Keep every `id` globally unique.
- Do not mix unrelated categories in one case (`INJ-*` vs `PII-*`).
- Keep one primary assertion per case; split complex behavior into multiple cases.
- Keep synthetic secrets/keys constructed at runtime in tests to avoid static secret-like literals in tracked files.

## Safety rules

- Treat all corpus content as untrusted input.
- Do not bulk-paste corpus content into AI assistants.
- Use minimal snippets only when needed for targeted debugging.
- Keep all decision logic and rationale documented in `docs/`.
