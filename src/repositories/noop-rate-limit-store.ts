import type { RateLimitResult, RateLimitStore } from "../domain/rate-limit.js";

/** Fallback limiter used when Redis is not configured. */
export class NoopRateLimitStore implements RateLimitStore {
  async consume(_apiKeyId: string, limitPerMinute: number): Promise<RateLimitResult> {
    return {
      allowed: true,
      currentCount: 1,
      limit: limitPerMinute,
      resetInSeconds: 60
    };
  }
}
