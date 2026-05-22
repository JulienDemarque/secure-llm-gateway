import express, { type NextFunction, type Request, type Response } from "express";
import { createHash, randomUUID } from "node:crypto";
import swaggerUi from "swagger-ui-express";
import type { AuditLogRepository, AuditStatus } from "./domain/audit.js";
import type { ApiKeyRepository } from "./domain/auth.js";
import type { LlmChatMessage, LlmClient } from "./domain/llm.js";
import type { RedactionTokenRepository } from "./domain/pii.js";
import type { PromptInjectionDetector } from "./domain/prompt-injection.js";
import { GenericLlmPromptInjectionDetector } from "./detectors/generic-llm-prompt-injection-detector.js";
import type { RateLimitStore } from "./domain/rate-limit.js";
import { getMongoHealthStatus } from "./db/mongoose.js";
import { getOllamaHealthStatus } from "./db/ollama.js";
import { getRedisClient, getRedisHealthStatus } from "./db/redis.js";
import { openApiDocument } from "./docs/openapi.js";
import { authenticateApiKey } from "./middleware/authenticate-api-key.js";
import { detectPromptInjection } from "./middleware/detect-prompt-injection.js";
import { redactInboundPii } from "./middleware/redact-inbound-pii.js";
import { rateLimitPerApiKey } from "./middleware/rate-limit-per-api-key.js";
import { requireAdmin } from "./middleware/require-admin.js";
import { LiteLlmClient } from "./providers/litellm-client.js";
import { MongoApiKeyRepository } from "./repositories/mongo-api-key-repository.js";
import { MongoAuditLogRepository } from "./repositories/mongo-audit-log-repository.js";
import { NoopRateLimitStore } from "./repositories/noop-rate-limit-store.js";
import { MongoRedactionTokenRepository } from "./repositories/mongo-redaction-token-repository.js";
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
  auditLogRepository?: AuditLogRepository;
  redactionTokenRepository?: RedactionTokenRepository;
  rateLimitStore?: RateLimitStore;
  llmClient?: LlmClient;
  promptInjectionDetector?: PromptInjectionDetector;
};

/** Stable content hash for request/response audit traceability. */
function hashForAudit(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value ?? null), "utf8").digest("base64");
}

/** Maps final HTTP status to assignment-required audit status values. */
function toAuditStatus(statusCode: number): AuditStatus {
  if (statusCode >= 500) {
    return "error";
  }
  if (statusCode >= 400) {
    return "blocked";
  }
  return "allowed";
}

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
  const auditLogRepository = options.auditLogRepository ?? new MongoAuditLogRepository();
  const redactionTokenRepository = options.redactionTokenRepository ?? new MongoRedactionTokenRepository();
  const redisClient = getRedisClient();
  const rateLimitStore =
    options.rateLimitStore ?? (redisClient ? new RedisRateLimitStore(redisClient) : new NoopRateLimitStore());
  const llmClient = options.llmClient ?? new LiteLlmClient();
  const promptInjectionDetector = options.promptInjectionDetector ?? new GenericLlmPromptInjectionDetector();
  const requireApiKey = authenticateApiKey(apiKeyRepository);
  const enforceRateLimit = rateLimitPerApiKey(rateLimitStore);
  const enforcePromptInjectionGuard = detectPromptInjection(promptInjectionDetector);
  const enforcePiiRedaction = redactInboundPii(redactionTokenRepository);
  app.use(express.json({ limit: "100kb" }));
  app.get("/openapi.json", (_req: Request, res: Response) => {
    res.status(200).json(openApiDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use("/v1/chat", (req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const correlationId = randomUUID();
    req.correlationId = correlationId;
    const requestHash = hashForAudit(req.body ?? null);
    let responseBody: unknown = null;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      responseBody = body;
      return originalJson(body);
    }) as Response["json"];

    const originalSend = res.send.bind(res);
    res.send = ((body: unknown) => {
      if (responseBody === null) {
        responseBody = body;
      }
      return originalSend(body);
    }) as Response["send"];

    res.on("finish", () => {
      const detectedThreats =
        req.promptDetectionResult && req.promptDetectionResult.blocked
          ? [
              {
                type: "prompt_injection" as const,
                ruleId: req.promptDetectionResult.ruleId,
                owaspCategory: req.promptDetectionResult.owaspCategory,
                confidence: req.promptDetectionResult.confidence
              }
            ]
          : [];

      const model =
        req.body && typeof req.body === "object" && "model" in req.body && typeof req.body.model === "string"
          ? req.body.model
          : null;

      void auditLogRepository
        .create({
          timestamp: new Date(startedAt),
          correlationId,
          apiKeyId: req.authContext?.apiKeyId ?? null,
          model,
          requestHash,
          responseHash: hashForAudit(responseBody),
          status: toAuditStatus(res.statusCode),
          latencyMs: Date.now() - startedAt,
          detectedThreats
        })
        .catch((error: unknown) => {
          console.error("audit-log-write-failed", error);
        });
    });

    return next();
  });

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
    enforcePiiRedaction,
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

  app.get("/v1/audit", requireApiKey, enforceRateLimit, requireAdmin, async (req: Request, res: Response) => {
    const sinceRaw = typeof req.query.since === "string" ? req.query.since : undefined;
    const limitRaw = typeof req.query.limit === "string" ? req.query.limit : undefined;

    let since: Date | undefined;
    if (sinceRaw) {
      const parsedSince = new Date(sinceRaw);
      if (Number.isNaN(parsedSince.getTime())) {
        return res.status(400).json({ error: "since must be a valid ISO-8601 timestamp" });
      }
      since = parsedSince;
    }

    let limit = 100;
    if (limitRaw) {
      const parsedLimit = Number.parseInt(limitRaw, 10);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
        return res.status(400).json({ error: "limit must be an integer between 1 and 500" });
      }
      limit = parsedLimit;
    }

    const entries = await auditLogRepository.list({ since, limit });
    return res.status(200).json({ entries });
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
