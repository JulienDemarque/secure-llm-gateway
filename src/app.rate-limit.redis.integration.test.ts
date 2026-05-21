import { createClient, type RedisClientType } from "redis";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { ApiKeyRecord, ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatRequest, LlmClient } from "./domain/llm.js";
import type {
  PromptInjectionDetectionResult,
  PromptInjectionDetector,
  PromptMessage
} from "./domain/prompt-injection.js";
import { NoopAuditLogRepository } from "./repositories/noop-audit-log-repository.js";
import { RedisRateLimitStore } from "./repositories/redis-rate-limit-store.js";
import { hashApiKey } from "./security/hash.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const RUN_REDIS_INTEGRATION_TESTS = process.env.ENABLE_REDIS_INTEGRATION_TESTS === "1";

/** Lightweight API key repository stub for integration tests. */
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

/** LLM stub used to isolate Redis rate-limit behavior in integration tests. */
class FakeLlmClient implements LlmClient {
  async createChatCompletion(request: LlmChatRequest): Promise<unknown> {
    return {
      id: "cmpl-redis-integration-test",
      model: request.model,
      choices: [{ message: { role: "assistant", content: "ok" } }]
    };
  }
}

/** Default allow detector for Redis integration tests. */
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

describe.skipIf(!RUN_REDIS_INTEGRATION_TESTS)("rate limiting middleware (Redis integration)", () => {
  let redisClient: RedisClientType;

  function makeApp() {
    const keyA = "redis-int-client-a";
    const keyB = "redis-int-client-b";
    const repository = new InMemoryApiKeyRepository([
      {
        id: "client-a-int",
        keyHash: hashApiKey(keyA),
        role: "client",
        status: "active",
        rateLimitPerMinute: 2
      },
      {
        id: "client-b-int",
        keyHash: hashApiKey(keyB),
        role: "client",
        status: "active",
        rateLimitPerMinute: 2
      }
    ]);

    process.env.OPENAI_API_KEY = "test-provider-key";

    return {
      app: createApp({
        apiKeyRepository: repository,
        rateLimitStore: new RedisRateLimitStore(redisClient),
        llmClient: new FakeLlmClient(),
        promptInjectionDetector: new AllowPromptInjectionDetector(),
        auditLogRepository: new NoopAuditLogRepository()
      }),
      keys: { keyA, keyB }
    };
  }

  beforeAll(async () => {
    redisClient = createClient({ url: REDIS_URL });
    await redisClient.connect();
  });

  beforeEach(async () => {
    await redisClient.del("rl:client-a-int");
    await redisClient.del("rl:client-b-int");
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it("returns 429 after exceeding limit for the same key", async () => {
    const { app, keys } = makeApp();
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello-1" }] });
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello-2" }] });

    const blocked = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello-3" }] });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("rate limit exceeded");
  });

  it("uses independent Redis counters for different API keys", async () => {
    const { app, keys } = makeApp();
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "a-1" }] });
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "a-2" }] });

    const keyABlocked = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "a-3" }] });
    const keyBAllowed = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyB)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "b-1" }] });

    expect(keyABlocked.status).toBe(429);
    expect(keyBAllowed.status).toBe(200);
  });
});
