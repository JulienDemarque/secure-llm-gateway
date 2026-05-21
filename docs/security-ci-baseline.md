# Security and CI baseline

This document defines the minimum pre-implementation baseline for secret scanning and CI checks.

## Local secret scan command

- `gitleaks detect --config .gitleaks.toml --source . --no-git`

## CI baseline checks (definition)

Run on each push and pull request:

1. Secret scan
   - Run gitleaks with `.gitleaks.toml`.
   - Fail build on findings.
2. Test suite
   - Run project tests once test infrastructure exists.
   - Fail build on any test failure.

## Pre-commit baseline checks (local)

Run before each commit:

1. Secret scan (staged scope if supported, otherwise full repo)
   - Run gitleaks and block commit on findings.
2. Fast quality gate
   - Run quick tests/lint for changed files once tooling exists.
3. Commit message and metadata hygiene
   - Reject commits containing obvious secrets in message/body.

Implementation note:

- Prefer `husky` + lightweight scripts for local hooks.
- Keep pre-commit runtime short; full checks remain enforced in CI.

## Current repo hook scaffold

- Hook file: `.githooks/pre-commit`
- Current behavior:
  - runs gitleaks with `.gitleaks.toml`
  - fails commit on secret findings
- Activation options (choose one):
  - symlink `.git/hooks/pre-commit` to `.githooks/pre-commit`
  - set repo hooks path to `.githooks` in local git config

## Suggested CI sequence

1. Checkout
2. Setup runtime
3. Install dependencies
4. Run gitleaks
5. Run tests

## Notes

- This baseline satisfies pre-coding planning for assignment alignment.
- Full CI implementation should be added once project scaffolding is in place.
