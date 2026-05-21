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
