# Context budget guidelines

Keep assistant context focused so docs do not crowd out implementation-relevant code.

## Default active docs set

1. `docs/original-assignment.md`
2. `docs/implementation-plan.md`
3. One task-specific doc (for current iteration)
4. `docs/change-log.md` (append-only updates)

## Rules

- Do not load all docs at once unless explicitly needed.
- Prefer short sections and bullet updates over long prose.
- Put tactical details in one targeted doc instead of duplicating across many files.
- If a doc exceeds practical size, split by concern and link from `docs/README.md`.
