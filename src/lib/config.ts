import { z } from "zod";

const envSchema = z.object({
  DATABASE_PATH: z.string().default("./data/vibeslide.db"),
  DATA_DIRECTORY: z.string().default("./data"),

  EMBEDDING_API_URL: z.string().url().default("https://api.openai.com/v1/embeddings"),
  EMBEDDING_API_KEY: z.string().default(""),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

  AI_PROVIDER: z.string().default("openai"),
  AI_GENERATION_MODEL: z.string().default("gpt-4o"),
  AI_API_KEY: z.string().default(""),

  MAX_SOURCE_CHUNKS_PER_SLIDE: z.coerce.number().default(8),
  MAX_SLIDE_REPAIR_ATTEMPTS: z.coerce.number().default(2),
  SLIDE_GENERATION_CONCURRENCY: z.coerce.number().default(2),
});

let cached: z.infer<typeof envSchema> | null = null;

function getConfig() {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

export const config = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    return getConfig()[prop as keyof z.infer<typeof envSchema>];
  },
});
