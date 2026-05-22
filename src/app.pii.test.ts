import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { AuditLogQuery, AuditLogRecord, AuditLogRepository, CreateAuditLogInput } from "./domain/audit.js";
import type { ApiKeyRecord, ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatRequest, LlmClient } from "./domain/llm.js";
import type { RedactionTokenRecord, RedactionTokenRepository } from "./domain/pii.js";
import type {
  PromptInjectionDetectionResult,
  PromptInjectionDetector,
  PromptMessage
} from "./domain/prompt-injection.js";
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

class NoopAuditLogRepository implements AuditLogRepository {
  async create(_entry: CreateAuditLogInput): Promise<void> {}
  async list(_query: AuditLogQuery): Promise<AuditLogRecord[]> {
    return [];
  }
}

class InMemoryRedactionTokenRepository implements RedactionTokenRepository {
  readonly records: RedactionTokenRecord[] = [];

  async createMany(records: RedactionTokenRecord[]): Promise<void> {
    this.records.push(...records);
  }

  async listByCorrelationIds(correlationIds: string[]): Promise<RedactionTokenRecord[]> {
    const set = new Set(correlationIds);
    return this.records.filter((record) => set.has(record.correlationId));
  }
}

class CapturingLlmClient implements LlmClient {
  lastRequest: LlmChatRequest | null = null;

  async createChatCompletion(request: LlmChatRequest): Promise<unknown> {
    this.lastRequest = request;
    return {
      id: "cmpl-pii-test",
      model: request.model,
      choices: [{ message: { role: "assistant", content: "ok" } }]
    };
  }
}

class AllowPromptInjectionDetector implements PromptInjectionDetector {
  async detect(_messages: PromptMessage[]): Promise<PromptInjectionDetectionResult> {
    return {
      blocked: false,
      ruleId: "NONE",
      owaspCategory: "NONE",
      confidence: 0,
      rationale: "allow"
    };
  }
}

function makeApp() {
  process.env.OPENAI_API_KEY = "test-provider-key";
  process.env.PII_ENCRYPTION_KEY_ID = "pii-key-v1";
  process.env.PII_ENCRYPTION_KEY_B64 = Buffer.alloc(32, 7).toString("base64");

  const clientKey = "pii-client-key";
  const apiKeyRepository = new InMemoryApiKeyRepository([
    {
      id: "pii-client-1",
      keyHash: hashApiKey(clientKey),
      role: "client",
      status: "active",
      rateLimitPerMinute: 30
    }
  ]);
  const llmClient = new CapturingLlmClient();
  const redactionTokenRepository = new InMemoryRedactionTokenRepository();

  return {
    app: createApp({
      apiKeyRepository,
      llmClient,
      promptInjectionDetector: new AllowPromptInjectionDetector(),
      auditLogRepository: new NoopAuditLogRepository(),
      redactionTokenRepository
    }),
    llmClient,
    redactionTokenRepository,
    clientKey
  };
}

describe("pii redaction middleware", () => {
  it("redacts email, phone, and Israeli ID before provider call", async () => {
    const { app, llmClient, redactionTokenRepository, clientKey } = makeApp();

    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", clientKey)
      .send({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Contact me at test.user@example.com, +972-54-123-4567 and id 039337423."
          }
        ]
      });

    expect(response.status).toBe(200);
    expect(redactionTokenRepository.records.length).toBeGreaterThanOrEqual(3);
    const forwarded = llmClient.lastRequest?.messages[0]?.content ?? "";
    expect(forwarded).not.toContain("test.user@example.com");
    expect(forwarded).not.toContain("+972-54-123-4567");
    expect(forwarded).not.toContain("039337423");
    expect(forwarded).toContain("[PII_EMAIL:");
    expect(forwarded).toContain("[PII_PHONE:");
    expect(forwarded).toContain("[PII_IL_NATIONAL_ID:");
  });

  it("preserves non-PII content as-is", async () => {
    const { app, llmClient, redactionTokenRepository, clientKey } = makeApp();
    const payload = "Summarize this benign sentence.";

    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", clientKey)
      .send({
        model: "gpt-4o",
        messages: [{ role: "user", content: payload }]
      });

    expect(response.status).toBe(200);
    expect(redactionTokenRepository.records).toHaveLength(0);
    expect(llmClient.lastRequest?.messages[0]?.content).toBe(payload);
  });

  it("fails closed when encryption key material is missing and PII is found", async () => {
    const { app, clientKey } = makeApp();
    delete process.env.PII_ENCRYPTION_KEY_B64;

    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", clientKey)
      .send({
        model: "gpt-4o",
        messages: [{ role: "user", content: "my email is blocked@example.com" }]
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("pii-redaction-unavailable");
  });
});
