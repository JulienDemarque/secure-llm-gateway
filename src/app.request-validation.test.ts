import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { ApiKeyRecord, ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatRequest, LlmClient } from "./domain/llm.js";
import type {
  PromptInjectionDetectionResult,
  PromptInjectionDetector,
  PromptMessage,
} from "./domain/prompt-injection.js";
import { NoopAuditLogRepository } from "./repositories/noop-audit-log-repository.js";
import { NoopRedactionTokenRepository } from "./repositories/noop-redaction-token-repository.js";
import { hashApiKey } from "./security/hash.js";

class InMemoryApiKeyRepository implements ApiKeyRepository {
  private readonly byHash = new Map<string, ApiKeyRecord>();

  constructor(records: ApiKeyRecord[]) {
    for (const record of records) {
      this.byHash.set(record.keyHash, record);
    }
  }

  async findByHash(keyHash: string): Promise<ApiKeyRecord | null> {
    return this.byHash.get(keyHash) ?? null;
  }

  async touchLastUsed(_id: string): Promise<void> {}
}

class AllowPromptInjectionDetector implements PromptInjectionDetector {
  async detect(_messages: PromptMessage[]): Promise<PromptInjectionDetectionResult> {
    return {
      blocked: false,
      ruleId: "NONE",
      owaspCategory: "NONE",
      confidence: 0,
      rationale: "allow",
    };
  }
}

class FakeLlmClient implements LlmClient {
  async createChatCompletion(request: LlmChatRequest): Promise<unknown> {
    return {
      id: "cmpl-validation-test",
      model: request.model,
      choices: [{ message: { role: "assistant", content: "ok" } }],
    };
  }
}

const ORIGINAL_OPENAI = process.env.OPENAI_API_KEY;
const ORIGINAL_ANTHROPIC = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  process.env.OPENAI_API_KEY = ORIGINAL_OPENAI;
  process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC;
});

function makeApp() {
  const clientKey = "client-validation-key";
  const adminKey = "admin-validation-key";
  const apiKeyRepository = new InMemoryApiKeyRepository([
    {
      id: "client-validation-1",
      keyHash: hashApiKey(clientKey),
      role: "client",
      status: "active",
      rateLimitPerMinute: 100,
    },
    {
      id: "admin-validation-1",
      keyHash: hashApiKey(adminKey),
      role: "admin",
      status: "active",
      rateLimitPerMinute: 100,
    },
  ]);
  process.env.OPENAI_API_KEY = "test-provider-key";

  return {
    app: createApp({
      apiKeyRepository,
      llmClient: new FakeLlmClient(),
      promptInjectionDetector: new AllowPromptInjectionDetector(),
      auditLogRepository: new NoopAuditLogRepository(),
      redactionTokenRepository: new NoopRedactionTokenRepository(),
    }),
    keys: { clientKey, adminKey },
  };
}

describe("app request validation and edge paths", () => {
  it("returns invalid-json when request body is malformed", async () => {
    const { app, keys } = makeApp();
    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .set("content-type", "application/json")
      .send("{not-valid-json");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid-json");
  });

  it("validates model/message/max_tokens fields", async () => {
    const { app, keys } = makeApp();

    const invalidModel = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .send({ model: "bad-model", messages: [{ role: "user", content: "x" }] });
    expect(invalidModel.status).toBe(400);

    const invalidMessages = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .send({ model: "gpt-4o", messages: [] });
    expect(invalidMessages.status).toBe(400);

    const invalidRole = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .send({ model: "gpt-4o", messages: [{ role: "tool", content: "x" }] });
    expect(invalidRole.status).toBe(400);

    const invalidMaxTokens = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .send({
        model: "gpt-4o",
        messages: [{ role: "user", content: "x" }],
        max_tokens: 0,
      });
    expect(invalidMaxTokens.status).toBe(400);
  });

  it("returns 503 when provider keys are missing", async () => {
    const { app, keys } = makeApp();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello" }] });

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("provider-not-configured");
  });

  it("parses and normalizes correlation id header", async () => {
    const { app, keys } = makeApp();
    const validHeaderResponse = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .set("x-correlation-id", "  corr-123  ")
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello" }] });
    expect(validHeaderResponse.status).toBe(200);
    expect(validHeaderResponse.header["x-correlation-id"]).toBe("corr-123");

    const tooLong = "a".repeat(129);
    const tooLongHeaderResponse = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientKey)
      .set("x-correlation-id", tooLong)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello" }] });
    expect(tooLongHeaderResponse.status).toBe(200);
    expect(tooLongHeaderResponse.header["x-correlation-id"]).not.toBe(tooLong);
  });

  it("validates /v1/audit query parameters", async () => {
    const { app, keys } = makeApp();

    const invalidSince = await request(app)
      .get("/v1/audit?since=not-a-date")
      .set("x-api-key", keys.adminKey);
    expect(invalidSince.status).toBe(400);

    const invalidLimit = await request(app)
      .get("/v1/audit?limit=999")
      .set("x-api-key", keys.adminKey);
    expect(invalidLimit.status).toBe(400);

    const invalidIncludeOriginal = await request(app)
      .get("/v1/audit?includeOriginal=maybe")
      .set("x-api-key", keys.adminKey);
    expect(invalidIncludeOriginal.status).toBe(400);
  });

  it("reports provider missing state on /healthz when no key configured", async () => {
    const { app } = makeApp();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const response = await request(app).get("/healthz");
    expect(response.status).toBe(200);
    expect(response.body.dependencies.provider).toBe("missing-api-key");
  });
});
