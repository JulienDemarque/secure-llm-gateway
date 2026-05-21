import { createHash, timingSafeEqual } from "node:crypto";

/** Hashes an API key for storage and lookup. */
export function hashApiKey(rawApiKey: string): string {
  return createHash("sha256").update(rawApiKey, "utf8").digest("base64");
}

/**
 * Compares two hashes in constant time to reduce timing side-channel leakage.
 * Returns false early only when lengths differ because timingSafeEqual requires equal sizes.
 */
export function safeEqualHash(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
