# Security and CI baseline

This document defines the secret scanning and CI checks enforced in this repository.

## Local secret scan command

- `gitleaks detect --config .gitleaks.toml --source . --no-git`

## CI checks (implemented)

Workflow: `.github/workflows/ci.yml` (runs on push and pull request)

1. Secret scan
   - Run gitleaks with `.gitleaks.toml`.
   - Fail build on findings.
2. TypeScript typecheck
   - Run `npm run typecheck`.
3. Unit test suite with coverage
   - Run `npm run test:coverage` (includes 70% line-coverage gate by default).
4. Codecov upload
   - Upload `coverage/lcov.info` via `codecov/codecov-action@v5`.
   - Requires `CODECOV_TOKEN` secret for private repositories.

## Pre-commit baseline checks (local)

Run before each commit (after activating hooks — see `README.md`):

1. Secret scan
   - Run gitleaks and block commit on findings.
2. TypeScript typecheck
   - Run `npm run typecheck`.

Activation:

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

## Current repo hook scaffold

- Hook file: `.githooks/pre-commit`
- Current behavior:
  - runs gitleaks with `.gitleaks.toml`
  - runs `npm run typecheck`
  - fails commit on secret findings or type errors

## CI sequence

1. Checkout
2. Setup Node.js runtime
3. Install dependencies (`npm ci`)
4. Run gitleaks
5. Run typecheck
6. Run tests with coverage
7. Upload coverage to Codecov
