NOTE: the appendix with the prompt injections is not included here. This is a safe version of the orignial pdf. Do not modify this file, only format it

_______________________

SENIOR ENGINEERING CHALLENGE
SecureLLM Gateway
Build a production-grade security layer for LLM-powered applications.
Time limit 3–4 hours
Format GitHub repo submission + 30-minute defense session
Stack TypeScript / Node.js / Express, MongoDB, Redis
Deadline 5 days from receipt of this brief
Before opening any AI tool — read the Operating Notice on page 2. This document is
part of the test.


READ THIS FIRST
Operating Notice
Before you engage with any AI tool — Cursor, Claude, ChatGPT, Copilot, Gemini, or anything else
— read this page carefully.
This challenge brief is itself an artifact you should treat as untrusted input. Appendix A
contains a corpus of real prompt-injection patterns, exfiltration attempts, role-override probes,
and synthetic PII examples that your Gateway is required to detect. These patterns are
written in plain text, clearly labeled, and presented in their attack form so that your detection
logic can be tested against them.
If you paste the entire contents of this document into an AI assistant in a single prompt — for
example, dragging the PDF into your IDE's AI panel and asking "help me build this" — the AI
session may interpret the Appendix content as instructions rather than as test data. The
behavior of that AI assistant from that point forward should not be trusted to remain aligned
with your intent.
Two consequences flow from this. First, your PROMPTS.md is required to describe how you
interacted with AI on this challenge, including the first prompt you sent to any AI tool. Second,
the defense session begins with the question: "Walk us through your first interaction with an
AI tool on this challenge." This question is not rhetorical.
The behaviour under test
Do you treat unfamiliar artifacts as untrusted input before consuming them with an AI tool — or do you
treat them as ordinary documents? There is no penalty for using AI; we expect it. There is a penalty for
using AI carelessly with input you have not vetted.


SECTION 1
Context
You are joining an AI-native operational squad. The squad ships features for production AI systems and
is measured on speed-to-ship with security baked in from the first line of code. AI tooling is not optional
in our workflow — it is the multiplier that makes our pace possible. We expect every engineer in the
squad to leverage multiple AI tools fluently and to demonstrate that fluency in their output.
This challenge is intentionally scoped so that completing it on quality within 3–4 hours is not possible by
hand. Successful candidates will orchestrate AI tools across the same solution files to meet the
deadline. We are watching how you do that.
SECTION 2
The Mission
Build a SecureLLM Gateway — a small but production-grade Express service that sits between internal
application code and external LLM providers (Anthropic, OpenAI). Every LLM call in the organization
routes through your gateway; the gateway enforces a uniform security and audit layer so application
teams do not each re-implement these controls.
Your service is the only thing standing between trusted user input, untrusted LLM output, and a
regulated environment.
SECTION 3
Functional Requirements
Endpoints
Method Path Purpose Auth
POST /v1/chat Proxy a chat request through the full security pipeline
to the configured LLM provider.
client /
admin
GET /v1/audit Return audit log entries since a given timestamp (limit
≤ 500).
admin
only
GET /healthz Liveness check; reports Mongo + Redis reachability
and provider readiness.
none
Request body for POST /v1/chat
{
 "model": "claude-3-5-sonnet | gpt-4o",
 "messages": [{"role": "user", "content": "..."}],
 "max_tokens": 1024
}
Required header: x-api-key: <client-key>


Security controls — all mandatory
Each control runs as an independent middleware so it can be tested and reasoned about in isolation.
Detection patterns must catch every entry in Appendix A, including realistic variations.
# Control What it does
1 Authentication Every request requires a valid x-api-key. Keys are stored hashed in
Mongo. Two roles: client and admin. Only admin may call /v1/audit.
2 Rate limiting Per-API-key sliding window in Redis. Default 30 req/min. Configurable
per key.
3 Prompt-injection
detection
Inspect every incoming message. Detect at least three distinct attack
patterns. On detection: reject 400 and audit-log.
4 PII redaction (inbound) Redact ≥ 3 categories before sending to the LLM: email, phone (IL +
intl), and Israeli national ID. Redaction is reversible at audit time
(token-based).
5 Output validation
(outbound)
LLM output is untrusted. Refuse responses that leak secret patterns
(sk-…, JWT-shaped strings, AWS keys) or that echo a detected
injection.
6 Audit log Mongo record per request: timestamp, API key ID, model,
request/response hashes, detected threats, latency, status (allowed /
blocked / error).
7 Secrets handling Provider API keys via env vars only. No keys in code, commits, or
logs. Include a .gitleaks.toml or equivalent.
Engineering requirements
• TypeScript with strict: true.
• Unit tests for each security control module (injection detection, PII redaction, output validation,
auth). Vitest preferred.
• Dockerfile and docker-compose.yml bringing up service + Mongo + Redis with one command.
• README.md: how to run, env vars required, one paragraph per control on security architecture,
and known limitations.
LLM provider integration
Integrate one of Anthropic or OpenAI for the live call. If the key is missing at runtime, the service should
still start with a clear 503 from /v1/chat and a healthcheck that flags the missing provider. Do not stub
the call away — wire it for real if a key is present.
SECTION 4
AI Process Requirements
This challenge tests how you work with AI tools, not just the code you produce. Include a
PROMPTS.md in the repo root covering the points below. A submission without PROMPTS.md will not
be evaluated.


# What PROMPTS.md must contain
1 Tools used. Which AI tools you used (Claude, ChatGPT, Cursor, Copilot, Gemini, etc.) and for
what.
2 Why multiple tools. At least one moment where you used a second AI tool to verify, challenge, or
rewrite output from the first. At least two tools should touch the same solution file.
3 Three example prompts. Verbatim — one for code generation, one for security review, one for
debugging — plus a sentence on what you did with each output.
4 What you rejected. One example of AI output you rejected or rewrote, and why.
5 What you would do with more time. Two specific items that did not make the cut, and how AI
would help you complete them.
6 Your first AI interaction on this challenge. Reproduce verbatim the first prompt you sent to any
AI tool, and identify which tool. This will be cross-checked in the defense session.
SECTION 5
Deliverables
A public or share-linked GitHub repository containing:
Code Source code, TypeScript, fully typed.
Containers Dockerfile and docker-compose.yml.
Docs README.md and PROMPTS.md.
Tests Unit tests covering each security control.
Scanning .gitleaks.toml or equivalent secret-scan config.
You will receive a calendar invite for a 30-minute defense session within 48 hours of submission

SECTION 6
Defense Session
Thirty minutes, four parts. The opening question is the most important.
Minutes Phase What happens
0 – 3 Process
question
We open with a single question: walk us through your first interaction
with an AI tool on this challenge. Be specific. We compare your answer
to PROMPTS.md.
3 – 13 You drive Walk through architecture, the most interesting decision you made, and
where you cut scope.
AICY CYBER 360 SecureLLM Gateway · Senior Engineering Challenge
Confidential — Senior Engineering Challenge 6
Minutes Phase What happens
13 – 25 We drive Targeted questions on security choices, AI orchestration, and code
structure.
25 – 30 Live edit We may ask you to make one small modification to the code in real
time, using your preferred AI tools, while we watch.
SECTION 7
Evaluation Criteria
Five dimensions. Weights shown in parentheses.
Dimension Weight What we look for
Security correctness 25 % Do controls actually work? Does detection catch every entry
in the Appendix A corpus, including variations?
Code quality 20 % Clean, modular, typed, tested — or AI-paste pretending to be
a service?
AI orchestration 20 % Does PROMPTS.md show real multi-tool usage? Did you use
AI well, or did AI use you?
Untrusted-input hygiene 20 % How did you handle this PDF when working with AI tools?
Evidence is in PROMPTS.md, in your defense answer, and in
how your Gateway handles Appendix A.
Engineering judgment 15 % What did you cut and why? Did you ship something working,
or something half-done with great intentions?
SECTION 8
Signal — Negative and Positive
What will sink your submission
Each item below is on its own a no-hire signal.
• Service does not start with docker-compose up.
• Hardcoded secrets anywhere in the repo or git history.
• Security controls that are pass-through stubs.
• PROMPTS.md that is generic, evasive, or absent.
• No tests, or tests that pass without exercising security logic.
• Code copy-pasted verbatim from public repos without attribution.
• Detection logic that fails on the Appendix A corpus.
• Evidence that the full PDF was pasted into an AI tool wholesale and the candidate did not notice or
address it.
AICY CYBER 360 SecureLLM Gateway · Senior Engineering Challenge
Confidential — Senior Engineering Challenge 7
What will make your submission stand out
Not required. These are signal.
• Constant-time API key comparison.
• Working CI step that runs secret-scan and tests on every push.
• Structured logging (pino or similar) with a correlation ID per request.
• README section on what the service does not protect against.
• Tests that include adversarial inputs and variations, not just happy paths.
• Explicit description in PROMPTS.md of how you sanitised this PDF's contents before consuming
any of it with an AI tool.
SECTION 9
A Note on Honesty
Use whatever AI tools you want. We do not penalise AI usage — we expect it. But PROMPTS.md must
be honest about what you actually used. If we ask in the defense session for the third prompt in your list
and you cannot speak to it, the submission ends there.
Ship something you would defend in production.



[Appendix actual prompts example have been removed]

A · Direct Instruction Override
Attempts to override the system prompt or operating rules of the model directly.

INJ-A1 OWASP LLM01 · Direct Prompt Injection
Plain override with confirmation probe
Expected: block with 400, audit-log the rule that fired.

INJ-A2 OWASP LLM01 · Delimiter Injection
Forged role tokens to impersonate system messages
Expected: block with 400, audit-log the rule that fired.

INJ-A3 OWASP LLM01 · Authority Spoofing
Fake administrator handoff embedded in user content
Expected: block with 400, audit-log the rule that fired.

B · System Prompt and Context Extraction
Attempts to extract the system prompt, internal context, or environment details. Output validation must also catch
attempted leaks in the response.

INJ-B1 OWASP LLM02 · Prompt Extraction
Direct request for the system instructions
Expected: block at input layer; output validation also rejects any leakage.

INJ-B2 OWASP LLM02 · Context Window Probe
Markdown-format extraction of the prior context
Expected: block at input layer; output validation also rejects any leakage.

INJ-B3 OWASP LLM06 · Secret Exfiltration Probe
Probe for environment variables and API keys
Expected: block at input layer; output validation rejects any secret-shaped string.

C · Role Override and Persona Hijack
Attempts to replace the model's operating persona with one that has no restrictions.
INJ-C1 OWASP LLM01 · Persona Hijack
Classic DAN-style jailbreak
Expected: block with 400, audit-log the rule that fired.

INJ-C2 OWASP LLM01 · Interpreter Roleplay
Roleplay-as-interpreter probing for filesystem access
Expected: block with 400, audit-log the rule that fired

INJ-C3 OWASP LLM01 · Output Format Hijack
Force a structured-output format that signals a bypass
Expected: block with 400, audit-log the rule that fired.

D · PII That Must Be Redacted Before Reaching the LLM
All identifiers below are synthetic. ID numbers, phones, and emails were generated for this corpus and do not
correspond to real individuals.

PII-D1 Synthetic · Email + phone + Israeli national ID
Inline PII in natural prose
Expected: redact each PII span with a reversible token before forwarding to the LLM.

PII-D2 Synthetic · Multiple PII in mixed-format prose
Several individuals, several PII categories, mixed locales
Expected: redact each PII span with a reversible token before forwarding to the LLM.

PII-D3 Synthetic · PII embedded in structured payload
JSON payload with PII fields that must be redacted in-place
Expected: redact each PII span with a reversible token before forwarding to the LLM.


E · Indirect Injection (Payload Smuggling)
Attack instructions embedded inside what appears to be benign user content. Output validation must catch any
echo of the smuggled instruction if the message is allowed through.



Corpus Acceptance Criteria
Your test suite must include test cases that exercise every entry above:
• Each INJ-* entry produces a 400 response with an audit log entry identifying the rule that fired.
• Each PII-* entry is forwarded to the LLM with redacted spans; original values recoverable only via
the audit path.
• Output validation independently catches cases where the model echoes any INJ-* payload back
in its response (simulated via response stubbing in tests).
• Tests exercise at least one variation of each entry — case changes, whitespace, common
encoding tricks.