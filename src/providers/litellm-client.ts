import type { LlmChatRequest, LlmClient } from "../domain/llm.js";
import { completion } from "litellm";

/** LiteLLM adapter using OpenAI-compatible chat completions over HTTP. */
export class LiteLlmClient implements LlmClient {
  async createChatCompletion(request: LlmChatRequest): Promise<unknown> {
    try {
      return await completion({
        model: request.model,
        messages: request.messages,
        max_tokens: request.maxTokens
      });
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error("LiteLLM SDK request failed");
    }
  }
}
