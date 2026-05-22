import type { RedactionTokenRecord, RedactionTokenRepository } from "../domain/pii.js";
import { RedactionTokenModel } from "../models/redaction-token.js";

/** Mongo-backed reversible token storage for inbound PII redaction. */
export class MongoRedactionTokenRepository implements RedactionTokenRepository {
  async createMany(records: RedactionTokenRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }
    await RedactionTokenModel.insertMany(records);
  }

  async listByCorrelationIds(correlationIds: string[]): Promise<RedactionTokenRecord[]> {
    if (correlationIds.length === 0) {
      return [];
    }
    const docs = await RedactionTokenModel.find({ correlationId: { $in: correlationIds } }).lean();
    return docs.map((doc) => ({
      token: doc.token,
      correlationId: doc.correlationId,
      category: doc.category,
      ciphertext: doc.ciphertext,
      iv: doc.iv,
      authTag: doc.authTag,
      keyId: doc.keyId,
      apiKeyId: doc.apiKeyId ?? null,
      requestHash: doc.requestHash,
      createdAt: doc.createdAt
    }));
  }
}
