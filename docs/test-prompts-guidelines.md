# Test prompts guidelines

This document defines how `test-prompts/` is used without risking accidental prompt-injection ingestion in assistant contexts.

## Purpose

- Store local prompt-injection test corpora and mutation fixtures.
- Keep these assets out of default assistant context via ignore files.

## Local folder layout

- `test-prompts/raw/`: original corpus entries and source fixtures.
- `test-prompts/variants/`: transformed variants (case, spacing, encoding, obfuscation).
- `test-prompts/expected-outcomes/`: expected detector decisions for each fixture set.

## Safety rules

- Treat all corpus content as untrusted input.
- Do not bulk-paste corpus content into AI assistants.
- Use minimal snippets only when needed for targeted debugging.
- Keep all decision logic and rationale documented in `docs/`.
