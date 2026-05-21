import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { ApiKeyRecord, ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatRequest, LlmClient } from "./domain/llm.js";
import { hashApiKey } from "./security/hash.js";

/** Lightweight repository stub used to isolate middleware behavior in tests. */
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

/** Deterministic LLM stub to keep auth tests independent from network calls. */
class FakeLlmClient implements LlmClient {
  async createChatCompletion(request: LlmChatRequest): Promise<unknown> {
    return {
      id: "cmpl-auth-test",
      model: request.model,
      choices: [
        {
          message: {
            role: "assistant",
            content: "ok"
          }
        }
      ]
    };
  }
}

/** Creates a test app with seeded key states for auth/role scenarios. */
function makeApp() {
  const clientRaw = "client-key";
  const adminRaw = "admin-key";
  const revokedRaw = "revoked-key";
  const repository = new InMemoryApiKeyRepository([
    {
      id: "client-1",
      keyHash: hashApiKey(clientRaw),
      role: "client",
      status: "active",
      rateLimitPerMinute: 30
    },
    {
      id: "admin-1",
      keyHash: hashApiKey(adminRaw),
      role: "admin",
      status: "active",
      rateLimitPerMinute: 60
    },
    {
      id: "revoked-1",
      keyHash: hashApiKey(revokedRaw),
      role: "client",
      status: "revoked",
      rateLimitPerMinute: 30
    }
  ]);

  process.env.OPENAI_API_KEY = "test-provider-key";

  return {
    app: createApp({ apiKeyRepository: repository, llmClient: new FakeLlmClient() }),
    keys: { clientRaw, adminRaw, revokedRaw }
  };
}

/** Covers required auth outcomes: missing, invalid, revoked, client/admin authorization. */
describe("auth middleware", () => {
  it("returns 401 when x-api-key header is missing", async () => {
    const { app } = makeApp();
    const response = await request(app).post("/v1/chat").send({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hello" }]
    });
    expect(response.status).toBe(401);
  });

  it("returns 401 on invalid api key", async () => {
    const { app } = makeApp();
    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", "wrong-key")
      .send({
        model: "gpt-4o",
        messages: [{ role: "user", content: "hello" }]
      });
    expect(response.status).toBe(401);
  });

  it("returns 401 on revoked api key", async () => {
    const { app, keys } = makeApp();
    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.revokedRaw)
      .send({
        model: "gpt-4o",
        messages: [{ role: "user", content: "hello" }]
      });
    expect(response.status).toBe(401);
  });

  it("allows client api key for /v1/chat", async () => {
    const { app, keys } = makeApp();
    const response = await request(app)
      .post("/v1/chat")
      .set("x-api-key", keys.clientRaw)
      .send({
        model: "gpt-4o",
        messages: [{ role: "user", content: "hello" }]
      });
    expect(response.status).toBe(200);
  });

  it("blocks client role on /v1/audit with 403", async () => {
    const { app, keys } = makeApp();
    const response = await request(app).get("/v1/audit").set("x-api-key", keys.clientRaw);
    expect(response.status).toBe(403);
  });

  it("allows admin role on /v1/audit", async () => {
    const { app, keys } = makeApp();
    const response = await request(app).get("/v1/audit").set("x-api-key", keys.adminRaw);
    expect(response.status).toBe(501);
  });
});
