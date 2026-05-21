# SecureLLM Gateway docs set

This folder tracks the implementation strategy and security decisions for this repository.

## Contents

- `implementation-plan.md`: phased plan and prioritized TODO list.
- `technical-architecture-outline.md`: architecture structure, trust boundaries, and module plan.
- `research-matrix.md`: research topics, official sources, alternatives, and recommended fit.
- `detection-approach-comparison.md`: Ollama sidecar vs Ollama JS SDK + local classifier.
- `iteration-protocol.md`: small-step review workflow for every implementation cycle.
- `change-log.md`: running log of each implemented change iteration.
- `test-prompts-guidelines.md`: safe handling and local structure for untrusted prompt corpora.
- `dev-environment-preflight.md`: local tooling and pre-coding readiness checklist.
- `requirements-traceability.md`: mapping from assignment requirements to planned execution.
- `security-ci-baseline.md`: baseline secret scanning and CI checks definition.
- `ollama-js-integration-notes.md`: implementation-oriented Ollama JS SDK constraints and guardrails.
- `productionalization-notes.md`: post-assignment scale and resilience path (sidecar, load testing, SLOs).
- `context-budget-guidelines.md`: keep docs/context lean and assignment-focused.
