import type { NextFunction, Request, Response } from "express";
import type { RateLimitStore } from "../domain/rate-limit.js";

const DEFAULT_LIMIT_PER_MINUTE = 30;

/** Enforces per-API-key sliding-window request limits. */
export function rateLimitPerApiKey(rateLimitStore: RateLimitStore) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return res.status(401).json({ error: "missing auth context" });
    }

    const limit = req.authContext.rateLimitPerMinute ?? DEFAULT_LIMIT_PER_MINUTE;
    const result = await rateLimitStore.consume(req.authContext.apiKeyId, limit);
    if (!result.allowed) {
      return res.status(429).json({
        error: "rate limit exceeded",
        limit: result.limit,
        current: result.currentCount,
        reset_in_seconds: result.resetInSeconds
      });
    }

    return next();
  };
}
