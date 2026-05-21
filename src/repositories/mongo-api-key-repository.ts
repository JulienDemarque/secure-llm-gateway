import type { ApiKeyRecord, ApiKeyRepository } from "../domain/auth.js";
import { ApiKeyModel } from "../models/api-key.js";

/** Mongo-backed implementation used by runtime auth middleware. */
export class MongoApiKeyRepository implements ApiKeyRepository {
  /** Loads a single key record by hash for authentication checks. */
  async findByHash(keyHash: string): Promise<ApiKeyRecord | null> {
    const doc = await ApiKeyModel.findOne({ keyHash }).lean();
    if (!doc) {
      return null;
    }

    return {
      id: String(doc._id),
      keyHash: doc.keyHash,
      role: doc.role,
      status: doc.status,
      rateLimitPerMinute: doc.rateLimitPerMinute
    };
  }

  /** Tracks key usage without blocking request flow on write latency. */
  async touchLastUsed(id: string): Promise<void> {
    await ApiKeyModel.findByIdAndUpdate(id, { $set: { lastUsedAt: new Date() } }).lean();
  }
}
