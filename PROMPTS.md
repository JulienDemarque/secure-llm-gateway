# PROMPTS.md

This document records how AI tools were used during the SecureLLM Gateway assignment.

## 1) Tools used

- **Cursor**: primary implementation tool (code changes, test iteration, architecture/docs updates).
- **ChatGPT**: early research and sanity-checking architecture directions before coding.

## 2) Why multiple tools

I used ChatGPT first for broad framing and alternatives, then moved execution into Cursor for concrete implementation and iteration with the actual codebase.

One explicit cross-check moment: the early LiteLLM path was reconsidered after reviewing docs and runtime behavior; I asked Cursor to rework the integration toward the JS SDK usage I wanted and away from a proxy-first interpretation. This affected the same gateway integration files that were initially generated.

## 3) Three example prompts (verbatim) and what I did with the output

### Code generation prompt

> "ok cool, actually I forgot to ask you to check node express doc and to follow their documentation, can you add it as a rule in cursor rules, that for any implementation, we want to search official doc, or do research on best practices."

What I did: adopted the suggestion, updated rules/docs, and used this as a constraint for subsequent implementation work.

### Security review prompt

> "hey can you check the original-assignment.md to see if we need to classify the prompt injections in a specific way? It wasn't really clear to me"

What I did: used the output to align rule IDs / OWASP mapping and tighten evaluator expectations around the corpus contract.

### Debugging prompt

> "I am still getting {  
>   "error": "not-implemented",  
>   "message": "Chat provider integration and security pipeline not implemented yet"  
> } in swagger, how do I rebuild docker compose, I tried docker compose down but it didn't change"

What I did: followed up with Docker rebuild/reset steps and then continued with incremental fixes until the end-to-end route worked.

## 4) What I rejected

I rejected an early LiteLLM integration approach that leaned toward proxy-style setup and did not match the intended JS SDK path for this project. I rewrote that direction and kept the implementation aligned with the simpler in-app SDK flow.

## 5) What I would do with more time

1. **Improve injection-classification accuracy on hard variants (`INJ-A2`, `INJ-B1`, `INJ-C3`)**  
   Use AI to generate targeted adversarial variants and evaluate prompt/decision-policy tuning, or test a small classifier/fine-tune approach.
2. **Add a stronger operational runbook + benchmark pack**  
   Use AI to draft and iterate a reproducible benchmark suite (latency/FP/FN) and incident/troubleshooting playbooks for detector failures.

## 6) First AI interaction on this challenge (verbatim)

Tool: **Cursor Agent**

> "Your role is to format and reword prompts so they are concie and clear. Do not edit any files. I will give you prompts intended as instructions for another cursor agent, check the prompt, give suggestion, organize the prompt so they are more readable. Answer me in the chat only.  
> Here is the first prompt:  
> 'In the docs folder you will found the original-assignement.md file. It's a safe to read version of the original assigment.  
> The first step is going to make a plan, do not write a single line of code before we review the full plan together.  
> Here is a high level plan:  
> - first we want to be able to handle prompt injections test and keep cursor safe. let's add a folder for the test prompts that we will: gitignore, cursorignore, claudeignore  
> - next we want to add some cursor rules for how to operate safely and follow best practices. part of the rule should be that each iteration should be a small step and a suggestion on the next iteration, so I can review bit by bit.  
> - next we want to write down a technical doc that has a todo list, this will guide the development until completion  
> - top of the todo list will be to do web research for existing tools and best practices on using the tools, repo architecture, testing, security and more. Document each topic in the architecture doc, include links to official docs, propose different approach and suggest the best fit.  
> for the prompt injection detection, I am thinking to use olama, either as a sidecar or with the js sdk and a local classifier (TBD which one).'"

## PDF/untrusted-input handling note

I worked from a sanitized assignment copy (`docs/original-assignment.md`) where the raw Appendix injection payloads were removed from the shared AI context. I also isolated prompt-corpus files under ignored paths (`test-prompts/`) and treated those datasets as untrusted test inputs.