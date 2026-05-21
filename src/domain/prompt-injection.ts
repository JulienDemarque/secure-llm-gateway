/** Normalized chat message used by injection detection. */
export type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Expected detector output shape for prompt-injection decisions. */
export type PromptInjectionDetectionResult = {
  blocked: boolean;
  category: "instruction_override" | "data_exfiltration" | "policy_evasion" | "unknown";
  confidence: number;
  rationale: string;
};

/** Detector contract to support model swaps without route changes. */
export interface PromptInjectionDetector {
  detect(messages: PromptMessage[]): Promise<PromptInjectionDetectionResult>;
}
