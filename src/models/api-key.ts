import { Schema, model } from "mongoose";
import type { ApiKeyRole, ApiKeyStatus } from "../domain/auth.js";

/** Mongo document shape for stored API key metadata and policy. */
type ApiKeyDocument = {
  keyHash: string;
  role: ApiKeyRole;
  status: ApiKeyStatus;
  rateLimitPerMinute: number;
  label?: string;
  createdBy?: string;
  createdAt: Date;
  lastUsedAt?: Date;
};

/** Defines persisted API key schema, validation, and indexes. */
const apiKeySchema = new Schema<ApiKeyDocument>(
  {
    keyHash: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["client", "admin"], required: true },
    status: { type: String, enum: ["active", "revoked"], required: true, default: "active", index: true },
    rateLimitPerMinute: { type: Number, required: true, default: 30 },
    label: { type: String, required: false },
    createdBy: { type: String, required: false },
    createdAt: { type: Date, required: true, default: () => new Date() },
    lastUsedAt: { type: Date, required: false }
  },
  {
    collection: "api_keys"
  }
);

/** Mongoose model bound to the `api_keys` collection. */
export const ApiKeyModel = model<ApiKeyDocument>("ApiKey", apiKeySchema);
