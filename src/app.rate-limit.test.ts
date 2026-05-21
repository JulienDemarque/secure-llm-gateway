import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { ApiKeyRecord, ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatRequest, LlmClient } from "./domain/llm.js";
import type { RateLimitResult, RateLimitStore } from "./domain/rate-limit.js";
import { hashApiKey } from "./security/hash.js";

/** In-memory API key repo for rate-limit integration tests. */
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

/** Simple in-memory sliding-window approximation for deterministic tests. */
class InMemoryRateLimitStore implements RateLimitStore {
  private readonly counts = new Map<string, number>();

  async consume(apiKeyId: string, limitPerMinute: number): Promise<RateLimitResult> {
    const current = (this.counts.get(apiKeyId) ?? 0) + 1;
    this.counts.set(apiKeyId, current);
    return {
      allowed: current <= limitPerMinute,
      currentCount: current,
      limit: limitPerMinute,
      resetInSeconds: 60
    };
  }
}

/** Stable LLM stub so rate-limit tests only validate middleware behavior. */
class FakeLlmClient implements LlmClient {
  async createChatCompletion(request: LlmChatRequest): Promise<unknown> {
    return {
      id: "cmpl-rate-limit-test",
      model: request.model,
      choices: [{ message: { role: "assistant", content: "ok" } }]
    };
  }
}

function makeApp() {
  const keyA = "client-key-a";
  const keyB = "client-key-b";
  const repository = new InMemoryApiKeyRepository([
    {
      id: "client-a",
      keyHash: hashApiKey(keyA),
      role: "client",
      status: "active",
      rateLimitPerMinute: 2
    },
    {
      id: "client-b",
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
      rateLimitStore: new InMemoryRateLimitStore(),
      llmClient: new FakeLlmClient()
    }),
    keys: { keyA, keyB }
  };
}

describe("rate limiting middleware", () => {
  it("allows requests under per-key limit", async () => {
    const { app, keys } = makeApp();
    const first = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello" }] });
    const second = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "hello again" }] });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it("returns 429 when requests exceed per-key limit", async () => {
    const { app, keys } = makeApp();
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "m1" }] });
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "m2" }] });
    const third = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "m3" }] });

    expect(third.status).toBe(429);
    expect(third.body.error).toBe("rate limit exceeded");
  });

  it("tracks limits independently per API key", async () => {
    const { app, keys } = makeApp();
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "a1" }] });
    await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "a2" }] });

    const keyAThird = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyA)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "a3" }] });
    const keyBFirst = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.keyB)
      .send({ model: "gpt-4o", messages: [{ role: "user", content: "b1" }] });

    expect(keyAThird.status).toBe(429);
    expect(keyBFirst.status).toBe(200);
  });
});
