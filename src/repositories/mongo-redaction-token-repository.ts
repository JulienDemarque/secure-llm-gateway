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
}
