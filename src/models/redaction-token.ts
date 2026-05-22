import { Schema, model } from "mongoose";
import type { PiiCategory } from "../domain/pii.js";

type RedactionTokenDocument = {
  token: string;
  correlationId: string;
  category: PiiCategory;
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  apiKeyId: string | null;
  requestHash: string;
  createdAt: Date;
};

const redactionTokenSchema = new Schema<RedactionTokenDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    correlationId: { type: String, required: true, index: true },
    category: { type: String, enum: ["email", "phone", "il_national_id"], required: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    keyId: { type: String, required: true },
    apiKeyId: { type: String, required: false, default: null, index: true },
    requestHash: { type: String, required: true, index: true },
    createdAt: { type: Date, required: true, default: () => new Date(), index: true }
  },
  {
    collection: "redaction_tokens"
  }
);

export const RedactionTokenModel = model<RedactionTokenDocument>("RedactionToken", redactionTokenSchema);
