import type { Request, Response, NextFunction } from "express";
import type { PromptInjectionDetector, PromptMessage } from "../domain/prompt-injection.js";

type ChatBody = {
  messages?: Array<{ role?: string; content?: string }>;
};

/** Middleware that blocks suspicious requests before provider execution. */
export function detectPromptInjection(detector: PromptInjectionDetector) {
  return async (req: Request<unknown, unknown, ChatBody>, res: Response, next: NextFunction) => {
    try {
      const inputMessages: PromptMessage[] =
        req.body.messages?.flatMap((message) => {
          if (
            (message.role === "system" || message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string"
          ) {
            return [{ role: message.role, content: message.content }];
          }
          return [];
        }) ?? [];

      const result = await detector.detect(inputMessages);
      if (result.blocked) {
        return res.status(400).json({
          error: "prompt-injection-detected",
          category: result.category,
          confidence: result.confidence,
          rationale: result.rationale
        });
      }

      return next();
    } catch (error: unknown) {
      return res.status(502).json({
        error: "detector-failed",
        message: error instanceof Error ? error.message : "Prompt-injection detector failed"
      });
    }
  };
}
