export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface LLMProvider {
  generateText(messages: Message[]): Promise<string>;
  generateObject<T>(messages: Message[], schema: object): Promise<T>;
}
