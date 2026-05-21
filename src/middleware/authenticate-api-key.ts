import type { NextFunction, Request, Response } from "express";
import type { ApiKeyRepository } from "../domain/auth.js";
import { hashApiKey, safeEqualHash } from "../security/hash.js";

/** Validates x-api-key and enriches requests with authenticated key context. */
export function authenticateApiKey(apiKeyRepository: ApiKeyRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.header("x-api-key");
    if (!apiKeyHeader) {
      return res.status(401).json({ error: "missing x-api-key header" });
    }

    const candidateHash = hashApiKey(apiKeyHeader);
    const record = await apiKeyRepository.findByHash(candidateHash);
    if (!record || !safeEqualHash(candidateHash, record.keyHash) || record.status !== "active") {
      return res.status(401).json({ error: "invalid api key" });
    }

    req.authContext = {
      apiKeyId: record.id,
      role: record.role,
      rateLimitPerMinute: record.rateLimitPerMinute
    };

    // This update is intentionally non-blocking because auth success should not depend on telemetry writes.
    void apiKeyRepository.touchLastUsed(record.id);
    return next();
  };
}
