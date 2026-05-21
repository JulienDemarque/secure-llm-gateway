import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let hasConnected = false;

function getOrCreateRedisClient(): RedisClientType | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
  }
  return redisClient;
}

/** Connects to Redis when REDIS_URL is configured. */
export async function connectToRedisIfConfigured(): Promise<void> {
  const client = getOrCreateRedisClient();
  if (!client || hasConnected) {
    return;
  }
  await client.connect();
  hasConnected = true;
}

/** Returns an initialized Redis client when configured, otherwise null. */
export function getRedisClient(): RedisClientType | null {
  return getOrCreateRedisClient();
}

/** Returns a simplified Redis health state for the health endpoint. */
export function getRedisHealthStatus(): "ready" | "not-configured" | "not-ready" {
  const client = getOrCreateRedisClient();
  if (!client) {
    return "not-configured";
  }
  return client.isOpen ? "ready" : "not-ready";
}

/** Closes redis connection and resets module-level state. */
export async function disconnectRedis(): Promise<void> {
  if (!redisClient || !hasConnected) {
    return;
  }
  await redisClient.quit();
  hasConnected = false;
}
