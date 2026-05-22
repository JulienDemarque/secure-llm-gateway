import type { AuditLogQuery, AuditLogRecord, AuditLogRepository, CreateAuditLogInput } from "../domain/audit.js";
import { AuditLogModel } from "../models/audit-log.js";

/** Mongo-backed audit repository used for runtime request tracking. */
export class MongoAuditLogRepository implements AuditLogRepository {
  async create(entry: CreateAuditLogInput): Promise<void> {
    await AuditLogModel.create(entry);
  }

  async list(query: AuditLogQuery): Promise<AuditLogRecord[]> {
    const filter = query.since ? { timestamp: { $gte: query.since } } : {};
    const docs = await AuditLogModel.find(filter).sort({ timestamp: -1 }).limit(query.limit).lean();
    return docs.map((doc) => ({
      id: String(doc._id),
      timestamp: doc.timestamp,
      correlationId: doc.correlationId,
      apiKeyId: doc.apiKeyId ?? null,
      model: doc.model ?? null,
      requestHash: doc.requestHash,
      responseHash: doc.responseHash,
      status: doc.status,
      latencyMs: doc.latencyMs,
      detectedThreats: doc.detectedThreats ?? []
    }));
  }
}
