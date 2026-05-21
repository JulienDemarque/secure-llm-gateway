export type RateLimitResult = {
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetInSeconds: number;
};

export interface RateLimitStore {
  consume(apiKeyId: string, limitPerMinute: number): Promise<RateLimitResult>;
}
