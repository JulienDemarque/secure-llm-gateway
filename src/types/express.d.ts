import type { AuthContext } from "../domain/auth.js";
import type { PromptInjectionDetectionResult } from "../domain/prompt-injection.js";

/** Extends Express request typing so middleware can share auth context safely. */
declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
      promptDetectionResult?: PromptInjectionDetectionResult;
    }
  }
}

export {};
