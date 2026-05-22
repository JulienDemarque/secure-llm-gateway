import type { RedactionTokenRecord, RedactionTokenRepository } from "../domain/pii.js";

/** No-op fallback repository for contexts that do not persist redaction tokens. */
export class NoopRedactionTokenRepository implements RedactionTokenRepository {
  async createMany(_records: RedactionTokenRecord[]): Promise<void> {}
}
