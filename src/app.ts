import express, { type NextFunction, type Request, type Response } from "express";
import type { ApiKeyRepository } from "./domain/auth.js";
import { getMongoHealthStatus } from "./db/mongoose.js";
import { authenticateApiKey } from "./middleware/authenticate-api-key.js";
import { requireAdmin } from "./middleware/require-admin.js";
import { MongoApiKeyRepository } from "./repositories/mongo-api-key-repository.js";

/** Minimal chat message shape expected by the placeholder API contract. */
type ChatMessage = {
  role: string;
  content: string;
};

/** Request body contract for POST /v1/chat during bootstrap phase. */
type ChatRequestBody = {
  model?: string;
  messages?: ChatMessage[];
  max_tokens?: number;
};

/** Current challenge-scoped model allowlist. */
const SUPPORTED_MODELS = new Set(["claude-3-5-sonnet", "gpt-4o"]);

/** Provider readiness check used by /healthz and chat fallback behavior. */
function hasProviderKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

/** Redis readiness placeholder until active connectivity checks are implemented. */
function getRedisHealthStatus(): "not-configured" | "not-ready" {
  return process.env.REDIS_URL ? "not-ready" : "not-configured";
}

/** Optional wiring hooks used by tests to inject fake repositories. */
type CreateAppOptions = {
  apiKeyRepository?: ApiKeyRepository;
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
  const requireApiKey = authenticateApiKey(apiKeyRepository);
  app.use(express.json({ limit: "100kb" }));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      dependencies: {
        mongo: getMongoHealthStatus(),
        redis: getRedisHealthStatus(),
        provider: hasProviderKey() ? "ready" : "missing-api-key"
      }
    });
  });

  app.post("/v1/chat", requireApiKey, (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
    if (!validateChatRequest(req, res)) {
      return;
    }

    if (!hasProviderKey()) {
      return res.status(503).json({
        error: "provider-not-configured",
        message: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY to enable /v1/chat"
      });
    }

    return res.status(501).json({
      error: "not-implemented",
      message: "Chat provider integration and security pipeline not implemented yet"
    });
  });

  // Admin-only endpoint; audit implementation is intentionally deferred.
  app.get("/v1/audit", requireApiKey, requireAdmin, (_req: Request, res: Response) => {
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
