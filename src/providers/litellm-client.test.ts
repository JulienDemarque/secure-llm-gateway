import { describe, expect, it, vi, beforeEach } from "vitest";
import { LiteLlmClient } from "./litellm-client.js";

const completionMock = vi.hoisted(() => vi.fn());

vi.mock("litellm", () => ({
  completion: completionMock,
}));

describe("LiteLlmClient", () => {
  beforeEach(() => {
    completionMock.mockReset();
  });

  it("returns completion payload from SDK", async () => {
    const expected = { id: "cmpl_123", choices: [] };
    completionMock.mockResolvedValue(expected);
    const client = new LiteLlmClient();

    const result = await client.createChatCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 64,
    });

    expect(result).toEqual(expected);
    expect(completionMock).toHaveBeenCalledWith({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 64,
    });
  });

  it("rethrows Error instances from SDK", async () => {
    const sdkError = new Error("upstream-failed");
    completionMock.mockRejectedValue(sdkError);
    const client = new LiteLlmClient();

    await expect(
      client.createChatCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toBe(sdkError);
  });

  it("wraps non-Error failures from SDK", async () => {
    completionMock.mockRejectedValue("boom");
    const client = new LiteLlmClient();

    await expect(
      client.createChatCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toThrow("LiteLLM SDK request failed");
  });
});
