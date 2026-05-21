import type { RedisClientType } from "redis";
import type { RateLimitResult, RateLimitStore } from "../domain/rate-limit.js";

const WINDOW_SECONDS = 60;

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
redis.call('ZADD', key, now, member)
local count = redis.call('ZCARD', key)
redis.call('EXPIRE', key, window + 1)

local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local reset = window
if oldest and #oldest >= 2 then
  reset = math.max(1, math.ceil(window - (now - tonumber(oldest[2]))))
end

if count > limit then
  return {0, count, reset}
end
return {1, count, reset}
`;

/** Sliding-window per-key limiter backed by Redis sorted sets. */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redisClient: RedisClientType) {}

  async consume(apiKeyId: string, limitPerMinute: number): Promise<RateLimitResult> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const key = `rl:${apiKeyId}`;
    const member = `${nowSeconds}:${Math.random().toString(36).slice(2)}`;
    const raw = await this.redisClient.eval(SLIDING_WINDOW_SCRIPT, {
      keys: [key],
      arguments: [String(nowSeconds), String(WINDOW_SECONDS), String(limitPerMinute), member]
    });

    const [allowedRaw, currentCountRaw, resetRaw] = raw as [number, number, number];
    return {
      allowed: allowedRaw === 1,
      currentCount: Number(currentCountRaw),
      limit: limitPerMinute,
      resetInSeconds: Number(resetRaw)
    };
  }
}
