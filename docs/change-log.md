# Change log

Tracks repository changes made during this project. Each entry summarizes what changed and why.

## 2026-05-21 - Iteration 1 (safety and docs bootstrap)

- Added safety ignores:
  - created `.gitignore` with `test-prompts/` plus basic local artifact ignores
  - created `.claudeignore` with `test-prompts/`
- Added planning and architecture docs:
  - `docs/README.md`
  - `docs/implementation-plan.md`
  - `docs/technical-architecture-outline.md`
  - `docs/research-matrix.md`
  - `docs/detection-approach-comparison.md`
  - `docs/iteration-protocol.md`
- Added Cursor rules:
  - `.cursor/rules/safe-iteration-loop.mdc`
  - `.cursor/rules/untrusted-prompt-corpus-handling.mdc`
- Note: `.cursorignore` creation was blocked by workspace permissions.

## 2026-05-21 - Iteration 2 (requested adjustments)

- Updated `.cursor/rules/safe-iteration-loop.mdc`:
  - added rule to keep `docs/original-assignment.md` in active context to avoid requirement drift.
- Converted `docs/implementation-plan.md` into a checklist format:
  - added phase-based `[ ]` / `[x]` tracking for progress visibility.
- Added this `docs/change-log.md` file:
  - established logging requirement so each future change is summarized in this file.
- Note: `.cursorignore` creation still blocked by workspace permissions.
