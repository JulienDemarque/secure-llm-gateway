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
  - Defer deep benchmark and false-positive/false-negative comparison to a dedicated evaluation pass.

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
  - Run deeper pros/cons and latency/accuracy analysis before selecting a default model path.

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
