/** Supported API key roles enforced by auth/authorization middleware. */
export type ApiKeyRole = "client" | "admin";
/** Operational status of an API key record. */
export type ApiKeyStatus = "active" | "revoked";

/** Repository-facing API key payload used during request authentication. */
export type ApiKeyRecord = {
  id: string;
  keyHash: string;
  role: ApiKeyRole;
  status: ApiKeyStatus;
  rateLimitPerMinute: number;
};

/** Auth metadata attached to the Express request after successful verification. */
export type AuthContext = {
  apiKeyId: string;
  role: ApiKeyRole;
  rateLimitPerMinute: number;
};

/** Storage abstraction that lets middleware run with Mongo or in-memory repositories. */
export interface ApiKeyRepository {
  /** Returns the API key record associated with a precomputed hash, if any. */
  findByHash(keyHash: string): Promise<ApiKeyRecord | null>;
  /** Best-effort usage timestamp update used for operational visibility. */
  touchLastUsed(id: string): Promise<void>;
}
