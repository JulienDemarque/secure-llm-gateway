import { Schema, model } from "mongoose";
import type { AuditStatus } from "../domain/audit.js";
import type { PromptInjectionDetectionResult } from "../domain/prompt-injection.js";

type AuditLogDocument = {
  timestamp: Date;
  correlationId: string;
  apiKeyId: string | null;
  model: string | null;
  requestHash: string;
  responseHash: string;
  status: AuditStatus;
  latencyMs: number;
  detectedThreats: Array<{
    type: "prompt_injection";
    ruleId: PromptInjectionDetectionResult["ruleId"];
    owaspCategory: PromptInjectionDetectionResult["owaspCategory"];
    confidence: number;
  }>;
};

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    timestamp: { type: Date, required: true, index: true },
    correlationId: { type: String, required: true, index: true },
    apiKeyId: { type: String, required: false, default: null, index: true },
    model: { type: String, required: false, default: null },
    requestHash: { type: String, required: true },
    responseHash: { type: String, required: true },
    status: { type: String, enum: ["allowed", "blocked", "error"], required: true, index: true },
    latencyMs: { type: Number, required: true },
    detectedThreats: [
      {
        type: {
          type: String,
          enum: ["prompt_injection"],
          required: true
        },
        ruleId: {
          type: String,
          enum: [
            "NONE",
            "INJ-A1",
            "INJ-A2",
            "INJ-A3",
            "INJ-B1",
            "INJ-B2",
            "INJ-B3",
            "INJ-C1",
            "INJ-C2",
            "INJ-C3",
            "INJ-E1",
            "INJ-E2",
            "INJ-E3",
            "INJ-UNKNOWN"
          ],
          required: true
        },
        owaspCategory: {
          type: String,
          enum: ["LLM01", "LLM02", "LLM06", "NONE", "UNKNOWN"],
          required: true
        },
        confidence: { type: Number, required: true, min: 0, max: 1 }
      }
    ]
  },
  {
    collection: "audit_logs"
  }
);

export const AuditLogModel = model<AuditLogDocument>("AuditLog", auditLogSchema);
