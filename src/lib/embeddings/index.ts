import crypto from "crypto";
import OpenAI from "openai";
import { getEmbeddingConfig } from "@/lib/settings";
import { db } from "@/lib/db";

function hashContent(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function embed(texts: string[]): Promise<number[][]> {
  const { apiKey, baseURL, model } = getEmbeddingConfig();
  if (!apiKey) {
    throw new Error("No API key configured. Add your key on the Settings page.");
  }
  const openai = new OpenAI({ apiKey, baseURL });
  const response = await openai.embeddings.create({ model, input: texts });
  return response.data.map((item) => item.embedding);
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const hashes = texts.map(hashContent);
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const missingIndexes: number[] = [];

  const stmt = db.prepare("SELECT embedding FROM source_chunks WHERE embeddingHash = ?");
  for (let i = 0; i < texts.length; i++) {
    const row = stmt.get(hashes[i]) as { embedding: Buffer } | undefined;
    if (row?.embedding) {
      const parsed = JSON.parse(row.embedding.toString("utf-8")) as number[];
      results[i] = parsed;
    } else {
      missingIndexes.push(i);
    }
  }

  if (missingIndexes.length > 0) {
    const missingTexts = missingIndexes.map((i) => texts[i]);
    const embeddings = await embed(missingTexts);

    for (let j = 0; j < missingIndexes.length; j++) {
      const originalIndex = missingIndexes[j];
      results[originalIndex] = embeddings[j];
    }
  }

  return results as number[][];
}

export function storeEmbedding(chunkId: string, text: string, embedding: number[]): void {
  const hash = hashContent(text);
  const buffer = Buffer.from(JSON.stringify(embedding), "utf-8");
  db.prepare("UPDATE source_chunks SET embeddingHash = ?, embedding = ? WHERE id = ?").run(hash, buffer, chunkId);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
