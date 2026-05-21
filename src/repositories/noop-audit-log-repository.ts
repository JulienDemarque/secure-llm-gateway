import type { AuditLogQuery, AuditLogRecord, AuditLogRepository, CreateAuditLogInput } from "../domain/audit.js";

/** No-op fallback audit repository for tests/dev contexts without Mongo. */
export class NoopAuditLogRepository implements AuditLogRepository {
  async create(_entry: CreateAuditLogInput): Promise<void> {}

  async list(_query: AuditLogQuery): Promise<AuditLogRecord[]> {
    return [];
  }
}
