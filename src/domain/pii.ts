/** Supported deterministic PII categories required by assignment scope. */
export type PiiCategory = "email" | "phone" | "il_national_id";

/** Persisted reversible mapping for redacted inbound PII spans. */
export type RedactionTokenRecord = {
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

/** Storage abstraction for reversible redaction token persistence. */
export interface RedactionTokenRepository {
  createMany(records: RedactionTokenRecord[]): Promise<void>;
}
