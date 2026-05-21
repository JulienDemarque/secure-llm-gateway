/** Role/content message contract passed to the upstream LLM provider. */
export type LlmChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Normalized upstream chat request used by provider client adapters. */
export type LlmChatRequest = {
  model: string;
  messages: LlmChatMessage[];
  maxTokens?: number;
};

/** LLM provider adapter interface to keep route logic provider-agnostic. */
export interface LlmClient {
  createChatCompletion(request: LlmChatRequest): Promise<unknown>;
}
