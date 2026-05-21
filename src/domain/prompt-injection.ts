/** Normalized chat message used by injection detection. */
export type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Expected detector output shape for prompt-injection decisions. */
export type PromptInjectionRuleId =
  | "NONE"
  | "INJ-A1"
  | "INJ-A2"
  | "INJ-A3"
  | "INJ-B1"
  | "INJ-B2"
  | "INJ-B3"
  | "INJ-C1"
  | "INJ-C2"
  | "INJ-C3"
  | "INJ-E1"
  | "INJ-E2"
  | "INJ-E3"
  | "INJ-UNKNOWN";

export type PromptInjectionDetectionResult = {
  blocked: boolean;
  ruleId: PromptInjectionRuleId;
  owaspCategory: "LLM01" | "LLM02" | "LLM06" | "NONE" | "UNKNOWN";
  confidence: number;
  rationale: string;
};

/** Detector contract to support model swaps without route changes. */
export interface PromptInjectionDetector {
  detect(messages: PromptMessage[]): Promise<PromptInjectionDetectionResult>;
}
