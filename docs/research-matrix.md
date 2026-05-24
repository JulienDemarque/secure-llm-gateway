# Research matrix

Research is the top implementation priority. For each topic, this document tracks official references, alternatives, and best-fit recommendation.

## Topic: tools and best practices

- Official sources
  - OWASP LLM Top 10: <https://owasp.org/www-project-top-10-for-large-language-model-applications/>
  - NIST AI RMF: <https://www.nist.gov/itl/ai-risk-management-framework>
  - Ollama docs: <https://github.com/ollama/ollama>
- Alternatives
  - Fully deterministic rule engine only
  - Model-assisted detection + deterministic guardrails
  - Managed external AI firewall products
- Best-fit recommendation
  - Hybrid: Ollama-based semantic detection with deterministic blocking for critical signatures.

## Topic: prompt-injection detection with Ollama JS SDK

- Official sources
  - Ollama JS SDK: <https://github.com/ollama/ollama-js>
  - Ollama API/docs: <https://ollama.com>
- Alternatives
  - In-process SDK client (`ollama` package) in gateway process
  - Sidecar detector service calling Ollama server
  - Cloud-hosted Ollama endpoint with SDK client and auth headers
- Candidate model options (shortlist for deep evaluation)
  - Ollama-native: `llama-guard3` (primary starting point for local moderation-style screening).
  - Hugging Face candidates for later custom hosting:
    - `meta-llama/Prompt-Guard-2-22M`
    - `protectai/deberta-v3-base-prompt-injection-v2`
    - `qualifire/prompt-injection-sentinel`
- Best-fit recommendation
  - Start with in-process Ollama JS SDK behind a detector interface, with strict timeout, fallback policy, and audit tagging.
  - Keep sidecar-compatible interface boundaries so deployment can switch without endpoint contract changes.
  - Use structured JSON output schema for detector decisions and evidence fields.
  - Use `llama-guard3` as the initial local baseline and keep a replaceable adapter contract for future model swaps.

### Deep comparison criteria (prompt-injection)

- Detection quality for instruction-hijack and data-exfiltration attempts (including assignment Appendix A style variants).
- False positive risk on normal user prompts.
- Inference latency (p50/p95) under local hardware constraints.
- Integration complexity (hosting/runtime, parsing, failure modes).
- Operational burden (updates, version pinning, observability, incident debugging).

### Deep comparison: prompt-injection options (first pass)

- `llama-guard3` (Ollama-native)
  - Pros: easiest local integration with current Ollama JS path; no extra model serving stack; fast to prototype with structured JSON schema.
  - Cons: generic safety model (not only prompt-injection); may need prompt engineering/tuning to reduce false positives.
  - Fit: best default for near-term implementation in this repo.
- `meta-llama/Prompt-Guard-2-22M` (HF)
  - Pros: task-focused family for prompt-injection style detection; smaller model size can help latency/cost in dedicated serving setups.
  - Cons: not plug-and-play with current Ollama path; requires separate runtime/evaluation pipeline before adoption.
  - Fit: strong candidate for later A/B evaluation if `llama-guard3` precision/recall is insufficient.
- `protectai/deberta-v3-base-prompt-injection-v2` (HF)
  - Pros: classifier-style output can simplify deterministic thresholding; potentially predictable scoring behavior.
  - Cons: introduces non-Ollama model hosting and tokenization/runtime plumbing; domain drift risk without benchmark set from our target traffic.
  - Fit: fallback candidate for custom classifier path, not phase-1 default.
- `qualifire/prompt-injection-sentinel` (HF)
  - Pros: explicitly targeted for prompt-injection screening; possible complement in ensemble setups.
  - Cons: limited confidence without independent benchmarking and maintenance signal review.
  - Fit: exploratory option; hold until benchmark harness exists.

## Topic: PII/security detection model options (shortlist)

- Official sources
  - Microsoft Presidio: <https://microsoft.github.io/presidio/>
  - GLiNER: <https://github.com/urchade/GLiNER>
- Alternatives
  - Regex/rule-only PII detection
  - Presidio analyzer/anonymizer pipeline
  - GLiNER-based NER extraction with policy post-processing
  - Hybrid (rules + model-assisted entity detection)
- Best-fit recommendation
  - Keep current gateway plan as hybrid-capable: deterministic masking rules first, model-assisted PII detection as optional plug-in.
  - Preserve middleware contract so PII strategy can evolve without route contract changes.
  - Start with deterministic categories required by assignment (email, phone, Israeli national ID), then layer model-assisted detection for broader coverage.

### Deep comparison criteria (PII/security)

- Required-category coverage for assignment-mandated entities.
- Precision/recall trade-off and reversibility impact on audit workflows.
- Runtime footprint and local deployability.
- Ease of policy tuning (allowlists, locale-specific patterns, false-positive suppression).
- Operational maturity (docs, ecosystem, maintenance signal).

### Deep comparison: PII/security options (first pass)

- Deterministic rules only (regex + validators)
  - Pros: highest transparency and deterministic behavior; easy to enforce reversible tokenization policy; minimal infra complexity.
  - Cons: weaker recall for novel formats/contextual entities; maintenance grows with edge cases.
  - Fit: mandatory baseline for assignment categories.
- Microsoft Presidio
  - Pros: mature PII framework with analyzer/anonymizer design; extensible recognizers and policy controls.
  - Cons: extra service/runtime complexity and integration surface compared to simple in-process rules.
  - Fit: best candidate for production-grade PII expansion after baseline is stable.
- GLiNER
  - Pros: flexible NER-style detection that can catch entities beyond rigid regex patterns.
  - Cons: model inference cost and tuning complexity; may require additional post-processing for precise reversible redaction policy.
  - Fit: candidate for optional "high recall" mode, not default in first implementation milestone.
- Hybrid (rules + model-assisted)
  - Pros: balances deterministic guarantees for required categories with broader detection capability.
  - Cons: highest design complexity (conflict resolution, confidence thresholds, audit semantics).
  - Fit: recommended target architecture; phase in after deterministic baseline tests are solid.

### Focused research update: what to implement next for PII middleware

- Official sources reviewed
  - Presidio concepts: <https://microsoft.github.io/presidio/learn_presidio/concepts/>
  - Presidio supported entities/custom recognizers: <https://microsoft.github.io/presidio/supported_entities/>
  - Presidio recognizer extension docs: <https://microsoft.github.io/presidio/analyzer/adding_recognizers/>
  - Israeli ID validator reference (`python-stdnum` docs): <https://arthurdejong.org/python-stdnum/doc/1.13/stdnum.il.idnr>
  - Israeli ID validator source (`python-stdnum` implementation): <https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/il/idnr.py>
- Key findings
  - Presidio is Python-first and typically integrated as Analyzer/Anonymizer service(s), often via REST sidecar.
  - It has strong built-ins for global entities like `EMAIL_ADDRESS` and `PHONE_NUMBER`, and supports custom recognizers for region-specific identifiers.
  - Assignment requires guaranteed handling of exactly three inbound categories now (email, phone IL+intl, Israeli national ID) with reversible tokenization.
- Recommended pick for this repo now
  - Implement PII middleware in-process in Node/TypeScript first:
    - deterministic email + phone + Israeli ID detection/redaction (with checksum-aware validator for Israeli ID),
    - reversible token storage in Mongo as already designed.
  - Keep Presidio as phase-2 enhancement path (optional sidecar) for broader entity coverage and richer NLP/context behavior.
- Why this pick
  - Fastest path to assignment compliance with deterministic behavior and simpler operations in the current stack.
  - Avoids introducing Python service orchestration before baseline controls are complete.
  - Preserves extensibility: middleware contract can later route to Presidio for additional entities while keeping required categories deterministic.

## Topic: repo architecture

- Official sources
  - Express production best practices: <https://expressjs.com/en/advanced/best-practice-performance.html>
  - Node.js security guidance: <https://nodejs.org/en/security/>
- Alternatives
  - Flat route-centric architecture
  - Layered middleware with isolated security modules
  - Plugin system with dynamic control loading
- Best-fit recommendation
  - Layered middleware architecture for clear testability and auditability.

## Topic: testing

- Official sources
  - Vitest docs: <https://vitest.dev/guide/>
  - OWASP Web Security Testing Guide: <https://owasp.org/www-project-web-security-testing-guide/>
  - fast-check property testing: <https://dubzzz.github.io/fast-check/>
- Alternatives
  - Unit-only control tests
  - Unit + integration tests
  - Unit + integration + adversarial corpus + mutation/property testing
- Best-fit recommendation
  - Unit + integration + adversarial corpus baseline, then property-based variants for bypass discovery.

## Topic: security

- Official sources
  - OWASP ASVS: <https://owasp.org/www-project-application-security-verification-standard/>
  - OWASP API Security Top 10: <https://owasp.org/API-Security/>
  - gitleaks: <https://github.com/gitleaks/gitleaks>
- Alternatives
  - Minimal challenge-only controls
  - Defense-in-depth controls with explicit residual risks
  - External managed control plane
- Best-fit recommendation
  - Defense-in-depth in gateway code now, plus documented residual risks and known limitations.

## Topic: observability and tracing (LangSmith)

- Official sources
  - LangSmith docs: <https://docs.smith.langchain.com/>
  - Pino structured logging: <https://getpino.io/>
- Alternatives
  - Native structured logs + correlation IDs only (current baseline)
  - LangSmith tracing for LLM call spans and eval datasets
  - OpenTelemetry + external APM
- Best-fit recommendation
  - **Out of scope for assignment baseline.** Use `pino` with per-request `correlationId` and Mongo audit logs for traceability.
  - Revisit LangSmith post-assignment if multi-step agent workflows or hosted eval dashboards become a requirement (`docs/productionalization-notes.md`).

## Final recommendations summary

| Area | Decision | Rationale doc |
|------|----------|---------------|
| Prompt injection | Ollama JS SDK in-process + structured JSON | `docs/detection-approach-comparison.md` |
| PII | Node deterministic baseline + reversible tokens | This doc, § PII/security |
| Provider | LiteLLM JS SDK in-app | `docs/technical-architecture-outline.md` |
| Architecture | Layered Express middleware | This doc, § repo architecture |
| Testing | Unit + integration + adversarial corpus eval | This doc, § testing; `docs/test-prompts-guidelines.md` |
| Security baseline | Defense-in-depth + gitleaks CI | `docs/security-ci-baseline.md` |
| Observability | Pino + correlationId + audit logs | This doc, § LangSmith |
