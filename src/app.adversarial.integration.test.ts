import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "vitest";
import type { LlmChatMessage } from "./domain/llm.js";

const RUN_ADVERSARIAL_EVAL = process.env.ENABLE_ADVERSARIAL_EVAL === "1";
const ADVERSARIAL_PROMPTS_PATH = path.resolve(
  process.cwd(),
  "test-prompts/raw/adversarial-test-prompts.json",
);
const EVAL_BASE_URL = (
  process.env.ADVERSARIAL_EVAL_BASE_URL ?? "http://127.0.0.1:3000"
).replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 120000;
const EVAL_TEST_TIMEOUT_MS = 300000;
const HEALTH_PREFLIGHT_MAX_ATTEMPTS = 6;
const HEALTH_PREFLIGHT_RETRY_DELAY_MS = 1500;
const MIN_ASSERTION_SCORE_PERCENT = Number.parseFloat(
  process.env.ADVERSARIAL_EVAL_MIN_ASSERTION_SCORE_PERCENT ?? "0",
);
const FAIL_ON_ANY_MISMATCH = process.env.ADVERSARIAL_EVAL_FAIL_ON_ANY_MISMATCH === "1";

type AdversarialCase = {
  id: string;
  sourceRef: string;
  variant: string;
  input: {
    model: string;
    messages: LlmChatMessage[];
    max_tokens?: number;
  };
  expected: {
    httpStatus: number;
    decision: "allowed" | "blocked" | "error";
    ruleId?: string;
    owaspCategory?: string;
    mustRedactInboundPii?: boolean;
    mustBlockOutboundEcho?: boolean;
  };
};

type AdversarialDataset = {
  version: string;
  suite: string;
  cases: AdversarialCase[];
};

type HttpResult = {
  status: number;
  headers: Headers;
  body: unknown;
};

type EvalStats = {
  casesTotal: number;
  casesPassed: number;
  assertionsTotal: number;
  assertionsPassed: number;
};

async function requestJson(
  endpoint: string,
  options: RequestInit = {},
): Promise<HttpResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const targetUrl = `${EVAL_BASE_URL}${endpoint}`;
    const response = await fetch(targetUrl, {
      ...options,
      signal: controller.signal,
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: response.status, headers: response.headers, body };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(
      `HTTP request failed for ${endpoint} at ${EVAL_BASE_URL}: ${message}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDatasetShape(
  value: unknown,
): asserts value is AdversarialDataset {
  if (!value || typeof value !== "object") {
    throw new Error("adversarial dataset must be an object");
  }
  const dataset = value as Partial<AdversarialDataset>;
  if (
    typeof dataset.version !== "string" ||
    typeof dataset.suite !== "string" ||
    !Array.isArray(dataset.cases)
  ) {
    throw new Error("adversarial dataset missing required top-level fields");
  }
}

async function loadDataset(): Promise<AdversarialDataset> {
  const content = await readFile(ADVERSARIAL_PROMPTS_PATH, "utf8");
  const parsed = JSON.parse(content) as unknown;
  ensureDatasetShape(parsed);
  return parsed;
}

async function assertEvalPrerequisites(
  dataset: AdversarialDataset,
): Promise<void> {
  const clientApiKey = process.env.CLIENT_API_KEY;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!clientApiKey) {
    throw new Error(
      "CLIENT_API_KEY must be set in environment for adversarial eval",
    );
  }

  const requiresAdminAudit = dataset.cases.some(
    (testCase) => testCase.expected.mustRedactInboundPii,
  );
  if (requiresAdminAudit && !adminApiKey) {
    throw new Error(
      "ADMIN_API_KEY must be set to verify PII redaction expectations via /v1/audit",
    );
  }

  let healthResponse: HttpResult | null = null;
  let lastHealthError: Error | null = null;
  for (
    let attempt = 1;
    attempt <= HEALTH_PREFLIGHT_MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      healthResponse = await requestJson("/healthz");
      break;
    } catch (error: unknown) {
      lastHealthError =
        error instanceof Error
          ? error
          : new Error("unknown health preflight error");
      if (attempt < HEALTH_PREFLIGHT_MAX_ATTEMPTS) {
        await sleep(HEALTH_PREFLIGHT_RETRY_DELAY_MS);
      }
    }
  }

  if (!healthResponse) {
    throw new Error(
      `Failed health preflight against ${EVAL_BASE_URL}/healthz after ${HEALTH_PREFLIGHT_MAX_ATTEMPTS} attempts: ${
        lastHealthError?.message ?? "unknown error"
      }`,
    );
  }

  if (
    healthResponse.status !== 200 ||
    !healthResponse.body ||
    typeof healthResponse.body !== "object"
  ) {
    throw new Error(`Failed health preflight against ${EVAL_BASE_URL}/healthz`);
  }

  const dependencies =
    (healthResponse.body as { dependencies?: Record<string, unknown> })
      .dependencies ?? {};
  if (dependencies.ollama !== "ready") {
    throw new Error("Adversarial eval requires dependencies.ollama=ready");
  }
  if (dependencies.provider !== "ready") {
    throw new Error("Adversarial eval requires dependencies.provider=ready");
  }
}

describe.skipIf(!RUN_ADVERSARIAL_EVAL)(
  "adversarial corpus integration eval",
  () => {
    it(
      "replays adversarial dataset cases through /v1/chat and validates expected outcomes",
      async () => {
        const dataset = await loadDataset();
        await assertEvalPrerequisites(dataset);
        const failures: string[] = [];
        const stats: EvalStats = {
          casesTotal: dataset.cases.length,
          casesPassed: 0,
          assertionsTotal: 0,
          assertionsPassed: 0,
        };

        function recordAssertion(
          testCaseId: string,
          ok: boolean,
          message: string,
          caseFailures: string[],
        ): void {
          stats.assertionsTotal += 1;
          if (ok) {
            stats.assertionsPassed += 1;
            return;
          }
          const failureMessage = `${testCaseId}: ${message}`;
          failures.push(failureMessage);
          caseFailures.push(failureMessage);
        }

        function isPiiRedactionCase(testCase: AdversarialCase): boolean {
          return (
            testCase.sourceRef.startsWith("PII-") ||
            testCase.expected.mustRedactInboundPii === true
          );
        }

        for (const testCase of dataset.cases) {
          const caseFailures: string[] = [];
          const piiRedactionCase = isPiiRedactionCase(testCase);
          try {
            const response = await requestJson("/v1/chat", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-api-key": process.env.CLIENT_API_KEY ?? "",
              },
              body: JSON.stringify({
                model: testCase.input.model,
                messages: testCase.input.messages,
                max_tokens: testCase.input.max_tokens,
              }),
            });

            const responseBody = response.body as Record<
              string,
              unknown
            > | null;
            if (
              response.status === 502 &&
              responseBody?.error === "detector-failed"
            ) {
              recordAssertion(
                testCase.id,
                false,
                "detector-failed; ensure Ollama and PROMPT_GUARD_MODEL are available",
                caseFailures,
              );
              continue;
            }

            const normalizedExpectedStatus =
              piiRedactionCase && testCase.expected.mustRedactInboundPii
                ? 200
                : testCase.expected.httpStatus;

            recordAssertion(
              testCase.id,
              response.status === normalizedExpectedStatus,
              `unexpected status (expected ${normalizedExpectedStatus}, got ${response.status})`,
              caseFailures,
            );

            if (!piiRedactionCase && testCase.expected.ruleId) {
              recordAssertion(
                testCase.id,
                responseBody?.ruleId === testCase.expected.ruleId,
                `ruleId mismatch (expected ${testCase.expected.ruleId}, got ${String(responseBody?.ruleId)})`,
                caseFailures,
              );
            }
            if (!piiRedactionCase && testCase.expected.owaspCategory) {
              recordAssertion(
                testCase.id,
                responseBody?.owaspCategory === testCase.expected.owaspCategory,
                `owaspCategory mismatch (expected ${testCase.expected.owaspCategory}, got ${String(responseBody?.owaspCategory)})`,
                caseFailures,
              );
            }
            if (testCase.expected.mustRedactInboundPii) {
              const correlationId = response.headers.get("x-correlation-id");
              if (!correlationId) {
                recordAssertion(
                  testCase.id,
                  false,
                  "missing x-correlation-id response header",
                  caseFailures,
                );
                continue;
              }
              recordAssertion(
                testCase.id,
                true,
                "x-correlation-id response header present",
                caseFailures,
              );

              const auditResponse = await requestJson("/v1/audit?limit=500", {
                method: "GET",
                headers: {
                  "x-api-key": process.env.ADMIN_API_KEY ?? "",
                },
              });
              recordAssertion(
                testCase.id,
                auditResponse.status === 200,
                `failed to fetch audit records (status ${auditResponse.status})`,
                caseFailures,
              );
              if (auditResponse.status !== 200) {
                continue;
              }

              const entries =
                (
                  auditResponse.body as {
                    entries?: Array<Record<string, unknown>>;
                  }
                )?.entries ?? [];
              const matchingEntry = entries.find(
                (entry) => entry.correlationId === correlationId,
              );
              if (!matchingEntry) {
                recordAssertion(
                  testCase.id,
                  false,
                  "no audit entry found for correlationId",
                  caseFailures,
                );
                continue;
              }
              recordAssertion(
                testCase.id,
                true,
                "audit entry found for correlationId",
                caseFailures,
              );

              const redactedRequest = matchingEntry.redactedRequest;
              const redactedRequestText = JSON.stringify(
                redactedRequest ?? null,
              );
              recordAssertion(
                testCase.id,
                /\[PII_[A-Z_]+:[a-f0-9]{16}\]/.test(redactedRequestText),
                "expected inbound PII redaction tokens",
                caseFailures,
              );
            }
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : "unknown test case error";
            recordAssertion(
              testCase.id,
              false,
              `request/assertion failed (${message})`,
              caseFailures,
            );
          }

          if (caseFailures.length === 0) {
            stats.casesPassed += 1;
          }
        }

        const assertionScorePercent =
          stats.assertionsTotal > 0
            ? (stats.assertionsPassed / stats.assertionsTotal) * 100
            : 100;
        const casePassPercent =
          stats.casesTotal > 0
            ? (stats.casesPassed / stats.casesTotal) * 100
            : 100;

        console.info(
          `[adversarial-eval] cases=${stats.casesPassed}/${stats.casesTotal} (${casePassPercent.toFixed(1)}%), assertions=${stats.assertionsPassed}/${stats.assertionsTotal} (${assertionScorePercent.toFixed(1)}%), mismatches=${failures.length}`,
        );
        if (failures.length > 0) {
          console.info(`[adversarial-eval] mismatch details:\n- ${failures.join("\n- ")}`);
        }

        if (FAIL_ON_ANY_MISMATCH && failures.length > 0) {
          throw new Error(
            `Adversarial eval failures (${failures.length}):\n- ${failures.join("\n- ")}`,
          );
        }

        if (assertionScorePercent + Number.EPSILON < MIN_ASSERTION_SCORE_PERCENT) {
          throw new Error(
            `Adversarial eval score below threshold: ${assertionScorePercent.toFixed(1)}% < ${MIN_ASSERTION_SCORE_PERCENT.toFixed(1)}% (set by ADVERSARIAL_EVAL_MIN_ASSERTION_SCORE_PERCENT)`,
          );
        }
      },
      EVAL_TEST_TIMEOUT_MS,
    );
  },
);
