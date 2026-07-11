import OpenAI from "openai";
import { config } from "@/lib/config";
import { LLMProvider, Message } from "@/lib/llm/types";

const openai = new OpenAI({
  apiKey: config.AI_API_KEY,
});

export class OpenAIProvider implements LLMProvider {
  async generateText(messages: Message[]): Promise<string> {
    const response = await openai.chat.completions.create({
      model: config.AI_GENERATION_MODEL,
      messages,
    });

    return response.choices[0].message.content ?? "";
  }

  async generateObject<T>(messages: Message[], schema: object): Promise<T> {
    const response = await openai.chat.completions.create({
      model: config.AI_GENERATION_MODEL,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_object",
          strict: true,
          schema: schema as Record<string, unknown>,
        },
      },
    });

    const content = response.choices[0].message.content ?? "{}";
    return JSON.parse(content) as T;
  }
}

export function createOpenAIProvider(): OpenAIProvider {
  return new OpenAIProvider();
}
