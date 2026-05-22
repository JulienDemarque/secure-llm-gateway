import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { PiiCategory, RedactionTokenRecord, RedactionTokenRepository } from "../domain/pii.js";
import { encryptPiiValue } from "../security/pii-crypto.js";

type ChatBody = {
  messages?: Array<{ role?: string; content?: string }>;
};

type Match = {
  start: number;
  end: number;
  value: string;
  category: PiiCategory;
};

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const IL_PHONE_REGEX = /(?:\+972|0)\s*-?\s*(?:[2-4]|[8-9]|5\d|7\d)\s*-?\s*\d{3}\s*-?\s*\d{4}\b/g;
const INTL_PHONE_REGEX = /\+\d[\d\s\-()]{7,}\d\b/g;
const IL_ID_REGEX = /(?:\b\d{8,9}\b)|(?:\b\d{7,8}-\d\b)/g;

/** Builds deterministic request hash to link token records and audit paths. */
function hashRequestBody(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? null), "utf8").digest("base64");
}

/** Israeli ID checksum validation (Luhn-style, 9 digits with leading zero normalization). */
function isValidIsraeliId(candidate: string): boolean {
  const digits = candidate.replace(/-/g, "");
  if (!/^\d{1,9}$/.test(digits)) {
    return false;
  }

  const padded = digits.padStart(9, "0");
  if (Number.parseInt(padded, 10) <= 0) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < padded.length; index += 1) {
    const factor = index % 2 === 0 ? 1 : 2;
    const product = Number.parseInt(padded[index]!, 10) * factor;
    sum += product > 9 ? product - 9 : product;
  }
  return sum % 10 === 0;
}

/** Normalizes phone candidate to digits-only representation for deterministic validation. */
function normalizedPhoneDigits(candidate: string): string {
  return candidate.replace(/[^\d]/g, "");
}

/** Basic deterministic phone validator for IL and international formats. */
function isValidPhone(candidate: string): boolean {
  const digits = normalizedPhoneDigits(candidate);
  return digits.length >= 8 && digits.length <= 15;
}

/** Returns non-overlapping matches sorted by position, preferring longest candidates. */
function nonOverlapping(matches: Match[]): Match[] {
  const sorted = [...matches].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }
    return right.end - left.end;
  });

  const accepted: Match[] = [];
  let cursor = -1;
  for (const match of sorted) {
    if (match.start >= cursor) {
      accepted.push(match);
      cursor = match.end;
    }
  }
  return accepted;
}

/** Collects deterministic PII matches from a single message content string. */
function collectMatches(content: string): Match[] {
  const matches: Match[] = [];

  for (const result of content.matchAll(EMAIL_REGEX)) {
    if (!result[0] || result.index === undefined) {
      continue;
    }
    matches.push({
      start: result.index,
      end: result.index + result[0].length,
      value: result[0],
      category: "email"
    });
  }

  for (const result of content.matchAll(IL_PHONE_REGEX)) {
    if (
      !result[0] ||
      result.index === undefined ||
      !isValidPhone(result[0]) ||
      isValidIsraeliId(result[0])
    ) {
      continue;
    }
    matches.push({
      start: result.index,
      end: result.index + result[0].length,
      value: result[0],
      category: "phone"
    });
  }

  for (const result of content.matchAll(INTL_PHONE_REGEX)) {
    if (
      !result[0] ||
      result.index === undefined ||
      !isValidPhone(result[0]) ||
      isValidIsraeliId(result[0])
    ) {
      continue;
    }
    matches.push({
      start: result.index,
      end: result.index + result[0].length,
      value: result[0],
      category: "phone"
    });
  }

  for (const result of content.matchAll(IL_ID_REGEX)) {
    if (!result[0] || result.index === undefined || !isValidIsraeliId(result[0])) {
      continue;
    }
    matches.push({
      start: result.index,
      end: result.index + result[0].length,
      value: result[0],
      category: "il_national_id"
    });
  }

  return nonOverlapping(matches);
}

/** Creates deterministic token placeholder for redacted PII spans. */
function tokenPlaceholder(category: PiiCategory, token: string): string {
  return `[PII_${category.toUpperCase()}:${token}]`;
}

/** Redacts one message and returns redacted text plus token records to persist. */
function redactMessage(
  content: string,
  correlationId: string,
  requestHash: string,
  apiKeyId: string | null
): { redacted: string; records: RedactionTokenRecord[] } {
  const matches = collectMatches(content);
  if (matches.length === 0) {
    return { redacted: content, records: [] };
  }

  const records: RedactionTokenRecord[] = [];
  let redacted = "";
  let cursor = 0;
  for (const match of matches) {
    redacted += content.slice(cursor, match.start);
    const token = randomBytes(8).toString("hex");
    const encrypted = encryptPiiValue(match.value);
    records.push({
      token,
      correlationId,
      category: match.category,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyId: encrypted.keyId,
      apiKeyId,
      requestHash,
      createdAt: new Date()
    });
    redacted += tokenPlaceholder(match.category, token);
    cursor = match.end;
  }
  redacted += content.slice(cursor);

  return { redacted, records };
}

/** Redacts inbound PII before upstream model call and stores reversible token mappings. */
export function redactInboundPii(redactionTokenRepository: RedactionTokenRepository) {
  return async (req: Request<unknown, unknown, ChatBody>, res: Response, next: NextFunction) => {
    try {
      const messages = req.body?.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        return next();
      }

      const requestHash = hashRequestBody(req.body ?? null);
      const recordsToStore: RedactionTokenRecord[] = [];

      for (const message of messages) {
        if (typeof message?.content !== "string") {
          continue;
        }
        const correlationId = req.correlationId ?? requestHash;
        const { redacted, records } = redactMessage(
          message.content,
          correlationId,
          requestHash,
          req.authContext?.apiKeyId ?? null
        );
        message.content = redacted;
        recordsToStore.push(...records);
      }

      await redactionTokenRepository.createMany(recordsToStore);
      return next();
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith("pii-encryption-")) {
        return res.status(500).json({
          error: "pii-redaction-unavailable",
          message: "PII redaction encryption is not configured correctly"
        });
      }
      return res.status(500).json({
        error: "pii-redaction-failed",
        message: error instanceof Error ? error.message : "PII redaction failed"
      });
    }
  };
}
