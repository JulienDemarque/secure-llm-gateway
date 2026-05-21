import type { Request, Response, NextFunction } from "express";
import type { PromptInjectionDetector, PromptMessage } from "../domain/prompt-injection.js";

type ChatBody = {
  messages?: Array<{ role?: string; content?: string }>;
};

/** Enables detector-result debug logging for local troubleshooting. */
function isPromptGuardDebugEnabled(): boolean {
  return process.env.PROMPT_GUARD_DEBUG === "1";
}

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
      if (isPromptGuardDebugEnabled()) {
        console.log(
          JSON.stringify({
            event: "prompt-guard-decision",
            blocked: result.blocked,
            ruleId: result.ruleId,
            owaspCategory: result.owaspCategory,
            confidence: result.confidence,
            rationale: result.rationale
          })
        );
      }
      if (result.blocked) {
        return res.status(400).json({
          error: "prompt-injection-detected",
          ruleId: result.ruleId,
          owaspCategory: result.owaspCategory,
          confidence: result.confidence,
          rationale: result.rationale
        });
      }

      return next();
    } catch (error: unknown) {
      if (isPromptGuardDebugEnabled()) {
        console.log(
          JSON.stringify({
            event: "prompt-guard-error",
            message: error instanceof Error ? error.message : "Prompt-injection detector failed"
          })
        );
      }
      return res.status(502).json({
        error: "detector-failed",
        message: error instanceof Error ? error.message : "Prompt-injection detector failed"
      });
    }
  };
}
