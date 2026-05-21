import express, { type NextFunction, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import type { ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatMessage, LlmClient } from "./domain/llm.js";
import type { PromptInjectionDetector } from "./domain/prompt-injection.js";
import { GenericLlmPromptInjectionDetector } from "./detectors/generic-llm-prompt-injection-detector.js";
import type { RateLimitStore } from "./domain/rate-limit.js";
import { getMongoHealthStatus } from "./db/mongoose.js";
import { getOllamaHealthStatus } from "./db/ollama.js";
import { getRedisClient, getRedisHealthStatus } from "./db/redis.js";
import { openApiDocument } from "./docs/openapi.js";
import { authenticateApiKey } from "./middleware/authenticate-api-key.js";
import { detectPromptInjection } from "./middleware/detect-prompt-injection.js";
import { rateLimitPerApiKey } from "./middleware/rate-limit-per-api-key.js";
import { requireAdmin } from "./middleware/require-admin.js";
import { LiteLlmClient } from "./providers/litellm-client.js";
import { MongoApiKeyRepository } from "./repositories/mongo-api-key-repository.js";
import { NoopRateLimitStore } from "./repositories/noop-rate-limit-store.js";
import { RedisRateLimitStore } from "./repositories/redis-rate-limit-store.js";

/** Request body contract for POST /v1/chat during bootstrap phase. */
type ChatRequestBody = {
  model?: string;
  messages?: LlmChatMessage[];
  max_tokens?: number;
};

/** Current challenge-scoped model allowlist. */
const SUPPORTED_MODELS = new Set(["claude-3-5-sonnet", "gpt-4o"]);
const SUPPORTED_MESSAGE_ROLES = new Set(["system", "user", "assistant"]);

/** Provider readiness check used by /healthz and chat fallback behavior. */
function hasProviderKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

/** Optional wiring hooks used by tests to inject fake repositories. */
type CreateAppOptions = {
  apiKeyRepository?: ApiKeyRepository;
  rateLimitStore?: RateLimitStore;
  llmClient?: LlmClient;
  promptInjectionDetector?: PromptInjectionDetector;
};

/** Validates chat payload structure before security pipeline execution. */
function validateChatRequest(req: Request<unknown, unknown, ChatRequestBody>, res: Response): boolean {
  const { model, messages, max_tokens } = req.body ?? {};
  if (!model || !SUPPORTED_MODELS.has(model)) {
    res.status(400).json({ error: "model must be one of: claude-3-5-sonnet, gpt-4o" });
    return false;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return false;
  }
  if (
    messages.some(
      (message) =>
        typeof message !== "object" ||
        message === null ||
        !SUPPORTED_MESSAGE_ROLES.has(message.role) ||
        typeof message.content !== "string"
    )
  ) {
    res.status(400).json({ error: "each message must include valid role and string content" });
    return false;
  }
  if (max_tokens !== undefined && (!Number.isInteger(max_tokens) || max_tokens <= 0)) {
    res.status(400).json({ error: "max_tokens must be a positive integer when provided" });
    return false;
  }
  return true;
}

/** Builds the Express app with baseline routes and security middleware chain. */
export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const apiKeyRepository = options.apiKeyRepository ?? new MongoApiKeyRepository();
  const redisClient = getRedisClient();
  const rateLimitStore =
    options.rateLimitStore ?? (redisClient ? new RedisRateLimitStore(redisClient) : new NoopRateLimitStore());
  const llmClient = options.llmClient ?? new LiteLlmClient();
  const promptInjectionDetector = options.promptInjectionDetector ?? new GenericLlmPromptInjectionDetector();
  const requireApiKey = authenticateApiKey(apiKeyRepository);
  const enforceRateLimit = rateLimitPerApiKey(rateLimitStore);
  const enforcePromptInjectionGuard = detectPromptInjection(promptInjectionDetector);
  app.use(express.json({ limit: "100kb" }));
  app.get("/openapi.json", (_req: Request, res: Response) => {
    res.status(200).json(openApiDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.get("/healthz", async (_req: Request, res: Response) => {
    const ollamaStatus = await getOllamaHealthStatus();
    res.status(200).json({
      status: "ok",
      dependencies: {
        mongo: getMongoHealthStatus(),
        redis: getRedisHealthStatus(),
        ollama: ollamaStatus,
        provider: hasProviderKey() ? "ready" : "missing-api-key"
      }
    });
  });

  app.post(
    "/v1/chat",
    requireApiKey,
    enforceRateLimit,
    enforcePromptInjectionGuard,
    async (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
      if (!validateChatRequest(req, res)) {
        return;
      }

      if (!hasProviderKey()) {
        return res.status(503).json({
          error: "provider-not-configured",
          message: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY to enable /v1/chat"
        });
      }

      try {
        const completion = await llmClient.createChatCompletion({
          model: req.body.model ?? "",
          messages: req.body.messages ?? [],
          maxTokens: req.body.max_tokens
        });
        return res.status(200).json(completion);
      } catch (error: unknown) {
        return res.status(502).json({
          error: "provider-request-failed",
          message: error instanceof Error ? error.message : "Failed to call LiteLLM provider"
        });
      }
    }
  );

  // Admin-only endpoint; audit implementation is intentionally deferred.
  app.get("/v1/audit", requireApiKey, enforceRateLimit, requireAdmin, (_req: Request, res: Response) => {
    res.status(501).json({
      error: "not-implemented",
      message: "Audit retrieval pipeline not implemented yet"
    });
  });

  // Converts malformed JSON parser errors into stable API error payloads.
  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
      error instanceof SyntaxError &&
      "status" in error &&
      (error as { status?: number }).status === 400 &&
      "body" in error
    ) {
      return res.status(400).json({
        error: "invalid-json",
        message: "Malformed JSON request body"
      });
    }
    return next(error);
  });

  return app;
}
