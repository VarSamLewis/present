import { LLMProvider } from "@/lib/llm/types";
import { createOpenAIProvider } from "@/lib/llm/openai";
import { config } from "@/lib/config";

const providers: Record<string, () => LLMProvider> = {
  openai: createOpenAIProvider,
};

export function getLLMProvider(): LLMProvider {
  const factory = providers[config.AI_PROVIDER];
  if (!factory) {
    throw new Error(`Unknown AI provider: ${config.AI_PROVIDER}`);
  }
  return factory();
}
