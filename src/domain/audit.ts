import type { PromptInjectionDetectionResult } from "./prompt-injection.js";

/** Final request outcome stored in audit logs. */
export type AuditStatus = "allowed" | "blocked" | "error";

/** Threat metadata captured when a detector identifies suspicious content. */
export type DetectedThreat = {
  type: "prompt_injection";
  ruleId: PromptInjectionDetectionResult["ruleId"];
  owaspCategory: PromptInjectionDetectionResult["owaspCategory"];
  confidence: number;
};

/** Persisted audit record for a processed chat request. */
export type AuditLogRecord = {
  id: string;
  timestamp: Date;
  apiKeyId: string | null;
  model: string | null;
  requestHash: string;
  responseHash: string;
  status: AuditStatus;
  latencyMs: number;
  detectedThreats: DetectedThreat[];
};

/** Input payload used when creating a new audit log record. */
export type CreateAuditLogInput = Omit<AuditLogRecord, "id">;

/** Query parameters supported by audit log retrieval path. */
export type AuditLogQuery = {
  since?: Date;
  limit: number;
};

/** Storage abstraction for writing and querying audit events. */
export interface AuditLogRepository {
  create(entry: CreateAuditLogInput): Promise<void>;
  list(query: AuditLogQuery): Promise<AuditLogRecord[]>;
}
