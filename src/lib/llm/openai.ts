import OpenAI from "openai";
import { getAIConfig } from "@/lib/settings";
import { LLMProvider, Message } from "@/lib/llm/types";

function getClient(): { client: OpenAI; model: string } {
  const { apiKey, baseURL, model } = getAIConfig();
  if (!apiKey) {
    throw new Error("No API key configured. Add your key on the Settings page.");
  }
  return { client: new OpenAI({ apiKey, baseURL }), model };
}

export class OpenAIProvider implements LLMProvider {
  async generateText(messages: Message[]): Promise<string> {
    const { client, model } = getClient();
    const response = await client.chat.completions.create({
      model,
      messages,
    });

    return response.choices[0].message.content ?? "";
  }

  async generateObject<T>(messages: Message[], schema: object): Promise<T> {
    const { client, model } = getClient();
    const response = await client.chat.completions.create({
      model,
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
