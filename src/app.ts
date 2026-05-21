import express, { type NextFunction, type Request, type Response } from "express";

type ChatMessage = {
  role: string;
  content: string;
};

type ChatRequestBody = {
  model?: string;
  messages?: ChatMessage[];
  max_tokens?: number;
};

const SUPPORTED_MODELS = new Set(["claude-3-5-sonnet", "gpt-4o"]);

function hasProviderKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      dependencies: {
        mongo: "not-configured",
        redis: "not-configured",
        provider: hasProviderKey() ? "ready" : "missing-api-key"
      }
    });
  });

  app.post("/v1/chat", (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
    const apiKeyHeader = req.header("x-api-key");
    if (!apiKeyHeader) {
      return res.status(401).json({ error: "missing x-api-key header" });
    }

    const { model, messages, max_tokens } = req.body ?? {};
    if (!model || !SUPPORTED_MODELS.has(model)) {
      return res.status(400).json({ error: "model must be one of: claude-3-5-sonnet, gpt-4o" });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages must be a non-empty array" });
    }
    if (max_tokens !== undefined && (!Number.isInteger(max_tokens) || max_tokens <= 0)) {
      return res.status(400).json({ error: "max_tokens must be a positive integer when provided" });
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

  app.get("/v1/audit", (_req: Request, res: Response) => {
    res.status(501).json({
      error: "not-implemented",
      message: "Audit retrieval pipeline not implemented yet"
    });
  });

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
