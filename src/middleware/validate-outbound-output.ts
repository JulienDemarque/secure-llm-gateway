import type { NextFunction, Request, Response } from "express";

const OPENAI_KEY_PATTERN = /\bsk-[A-Za-z0-9]{20,}\b/;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/;
const AWS_ACCESS_KEY_PATTERN = /\bAKIA[0-9A-Z]{16}\b/;

const INJECTION_PHRASE_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /(reveal|show|print)\s+.{0,40}(system prompt|system instructions?)/i,
  /(reveal|dump|print)\s+.{0,40}(env|environment|api key|credentials?)/i,
  /(you are now|act as)\s+.{0,40}(dan|administrator|developer mode)/i,
  /begin\s+system\s+prompt/i,
  /<!--[\s\S]*?-->/i
];

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const IL_PHONE_PATTERN = /\b(?:\+972|0)(?:[-\s]?\d){8,9}\b/g;
const INTL_PHONE_PATTERN = /\+\d[\d\s().-]{7,}\d/g;
const IL_ID_PATTERN = /\b\d{9}\b/g;

type OutputValidationFailureReason = "secret-pattern-detected" | "injection-echo-detected";

type OutputValidationResult = {
  blocked: boolean;
  reason?: OutputValidationFailureReason;
  pattern?: "openai_key" | "jwt" | "aws_access_key" | "injection_echo";
  response: unknown;
};

function normalizedPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function isValidPhone(raw: string): boolean {
  const digits = normalizedPhoneDigits(raw);
  return digits.length >= 8 && digits.length <= 15;
}

function isValidIsraeliId(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const value = Number.parseInt(digits[i] ?? "0", 10) * (i % 2 === 0 ? 1 : 2);
    sum += value > 9 ? value - 9 : value;
  }
  return sum % 10 === 0;
}

function redactOutboundPii(text: string): string {
  let result = text.replace(EMAIL_PATTERN, "[OUTBOUND_PII_EMAIL]");
  result = result.replace(IL_PHONE_PATTERN, (match) => {
    if (isValidIsraeliId(match)) {
      return match;
    }
    return isValidPhone(match) ? "[OUTBOUND_PII_PHONE]" : match;
  });
  result = result.replace(INTL_PHONE_PATTERN, (match) => {
    if (isValidIsraeliId(match)) {
      return match;
    }
    return isValidPhone(match) ? "[OUTBOUND_PII_PHONE]" : match;
  });
  result = result.replace(IL_ID_PATTERN, (match) => (isValidIsraeliId(match) ? "[OUTBOUND_PII_IL_NATIONAL_ID]" : match));
  return result;
}

function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

function collectStringValues(value: unknown, accumulator: string[]): void {
  if (typeof value === "string") {
    accumulator.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, accumulator);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      collectStringValues(nestedValue, accumulator);
    }
  }
}

function responseContainsSecretPattern(response: unknown): OutputValidationResult | null {
  const values: string[] = [];
  collectStringValues(response, values);
  for (const value of values) {
    if (OPENAI_KEY_PATTERN.test(value)) {
      return { blocked: true, reason: "secret-pattern-detected", pattern: "openai_key", response };
    }
    if (JWT_PATTERN.test(value)) {
      return { blocked: true, reason: "secret-pattern-detected", pattern: "jwt", response };
    }
    if (AWS_ACCESS_KEY_PATTERN.test(value)) {
      return { blocked: true, reason: "secret-pattern-detected", pattern: "aws_access_key", response };
    }
  }
  return null;
}

function outputEchoesInjection(messages: unknown, response: unknown): boolean {
  const messageText =
    Array.isArray(messages) && messages.length > 0
      ? messages
          .map((message) => (message && typeof message === "object" && typeof message.content === "string" ? message.content : ""))
          .join("\n")
      : "";

  if (!INJECTION_PHRASE_PATTERNS.some((pattern) => pattern.test(messageText))) {
    return false;
  }

  const responseValues: string[] = [];
  collectStringValues(response, responseValues);
  return responseValues.some((value) => INJECTION_PHRASE_PATTERNS.some((pattern) => pattern.test(value)));
}

function redactAssistantContent(response: unknown): unknown {
  const cloned = cloneJsonValue(response);
  if (
    !cloned ||
    typeof cloned !== "object" ||
    !("choices" in cloned) ||
    !Array.isArray((cloned as { choices?: unknown }).choices)
  ) {
    return cloned;
  }

  const typed = cloned as { choices: Array<{ message?: { content?: unknown } }> };
  typed.choices = typed.choices.map((choice) => {
    if (!choice?.message || typeof choice.message.content !== "string") {
      return choice;
    }
    return {
      ...choice,
      message: {
        ...choice.message,
        content: redactOutboundPii(choice.message.content)
      }
    };
  });
  return typed;
}

function validateOutboundContent(messages: unknown, response: unknown): OutputValidationResult {
  const secretPatternMatch = responseContainsSecretPattern(response);
  if (secretPatternMatch) {
    return secretPatternMatch;
  }

  if (outputEchoesInjection(messages, response)) {
    return {
      blocked: true,
      reason: "injection-echo-detected",
      pattern: "injection_echo",
      response
    };
  }

  return {
    blocked: false,
    response: redactAssistantContent(response)
  };
}

/** Validates and sanitizes provider output before returning response to clients. */
export function validateOutboundOutput() {
  return (req: Request, res: Response, next: NextFunction) => {
    const locals = res.locals as { providerCompletion?: unknown };
    const providerCompletion = locals.providerCompletion;
    if (providerCompletion === undefined) {
      return res.status(502).json({
        error: "output-validation-failed",
        message: "Missing provider response for output validation"
      });
    }

    const result = validateOutboundContent(req.body?.messages, providerCompletion);
    if (result.blocked) {
      return res.status(400).json({
        error: "output-validation-failed",
        reason: result.reason,
        pattern: result.pattern
      });
    }

    locals.providerCompletion = result.response;
    return next();
  };
}
