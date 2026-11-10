import { config } from "@/lib/config";
import { getSetting, setSetting } from "@/lib/db/repositories";

const API_KEY_SETTING = "aiApiKey";
const BASE_URL_SETTING = "aiBaseUrl";
const MODEL_SETTING = "aiModel";

export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-4o";

export type AIConfig = {
  apiKey: string;
  baseURL: string;
  model: string;
};

export function getAIConfig(): AIConfig {
  return {
    apiKey: getSetting(API_KEY_SETTING) ?? config.AI_API_KEY,
    baseURL: getSetting(BASE_URL_SETTING) ?? DEFAULT_BASE_URL,
    model: getSetting(MODEL_SETTING) ?? DEFAULT_MODEL,
  };
}

export function getEmbeddingConfig(): { apiKey: string; baseURL: string; model: string } {
  return {
    apiKey: getAIConfig().apiKey,
    baseURL: getSetting(BASE_URL_SETTING) ?? config.EMBEDDING_API_URL,
    model: config.EMBEDDING_MODEL,
  };
}

export function isConfigured(): boolean {
  return Boolean(getAIConfig().apiKey);
}

export function saveAIConfig({ apiKey, baseURL, model }: Partial<AIConfig>): void {
  if (apiKey !== undefined && apiKey !== "") setSetting(API_KEY_SETTING, apiKey);
  if (baseURL !== undefined && baseURL !== "") setSetting(BASE_URL_SETTING, baseURL);
  if (model !== undefined && model !== "") setSetting(MODEL_SETTING, model);
}
