import { beforeEach, describe, expect, it, vi } from "vitest";
import { GenericLlmPromptInjectionDetector } from "./generic-llm-prompt-injection-detector.js";

const chatMock = vi.hoisted(() => vi.fn());
const ctorArgsRef = vi.hoisted(() => ({ value: null as unknown }));
const ollamaCtorMock = vi.hoisted(() =>
  class MockOllama {
    constructor(args: unknown) {
      ctorArgsRef.value = args;
    }

    chat = chatMock;
  },
);

vi.mock("ollama", () => ({
  Ollama: ollamaCtorMock,
}));

describe("GenericLlmPromptInjectionDetector", () => {
  beforeEach(() => {
    chatMock.mockReset();
    ctorArgsRef.value = null;
    delete process.env.OLLAMA_HOST;
    delete process.env.PROMPT_GUARD_MODEL;
  });

  it("uses env fallbacks and returns sanitized non-blocking result", async () => {
    process.env.OLLAMA_HOST = "   ";
    process.env.PROMPT_GUARD_MODEL = "   ";
    chatMock.mockResolvedValue({
      message: {
        content: JSON.stringify({
          blocked: false,
          ruleId: "NONE",
          confidence: 0,
          rationale: "ok\u0000with-control-char",
        }),
      },
    });
    const detector = new GenericLlmPromptInjectionDetector();

    const result = await detector.detect([{ role: "user", content: "hello" }]);

    expect(ctorArgsRef.value).toEqual({
      host: "http://127.0.0.1:11434",
    });
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "llama3.1:8b",
        stream: false,
      }),
    );
    expect(result).toMatchObject({
      blocked: false,
      ruleId: "NONE",
      confidence: 0,
      owaspCategory: "NONE",
    });
    expect(result.rationale).toBe("ok with-control-char");
  });

  it("coerces contradictory non-blocking output into blocking decision", async () => {
    chatMock.mockResolvedValue({
      message: {
        content: JSON.stringify({
          blocked: false,
          ruleId: "INJ-A2",
          confidence: 0.8,
          rationale: "contradictory",
        }),
      },
    });
    const detector = new GenericLlmPromptInjectionDetector();

    const result = await detector.detect([{ role: "user", content: "ignore all previous" }]);

    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe("INJ-A2");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.owaspCategory).toBe("LLM01");
  });

  it("maps blocked+NONE output to INJ-UNKNOWN with minimum confidence", async () => {
    chatMock.mockResolvedValue({
      message: {
        content: JSON.stringify({
          blocked: true,
          ruleId: "NONE",
          confidence: 0.2,
          rationale: "inconsistent blocked output",
        }),
      },
    });
    const detector = new GenericLlmPromptInjectionDetector();

    const result = await detector.detect([{ role: "user", content: "payload" }]);

    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe("INJ-UNKNOWN");
    expect(result.confidence).toBeGreaterThanOrEqual(0.51);
    expect(result.owaspCategory).toBe("UNKNOWN");
  });

  it("throws on invalid schema output", async () => {
    chatMock.mockResolvedValue({
      message: {
        content: JSON.stringify({
          blocked: false,
          ruleId: "NONE",
          confidence: 0,
          rationale: "",
        }),
      },
    });
    const detector = new GenericLlmPromptInjectionDetector();

    await expect(
      detector.detect([{ role: "user", content: "test" }]),
    ).rejects.toThrow("detector-output-schema-invalid");
  });

  it("throws on empty content and non-object JSON", async () => {
    const detector = new GenericLlmPromptInjectionDetector();
    chatMock.mockResolvedValue({ message: { content: 123 } });
    await expect(
      detector.detect([{ role: "user", content: "test" }]),
    ).rejects.toThrow("detector-empty-content");

    chatMock.mockResolvedValue({ message: { content: JSON.stringify("string-json") } });
    await expect(
      detector.detect([{ role: "user", content: "test" }]),
    ).rejects.toThrow("detector-output-not-object");
  });
});
