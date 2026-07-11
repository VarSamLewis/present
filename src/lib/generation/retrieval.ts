import { db } from "@/lib/db";
import { getEmbeddings, cosineSimilarity, storeEmbedding } from "@/lib/embeddings";
import { SourceChunk } from "@/lib/schemas";
import { config } from "@/lib/config";

type ChunkWithEmbedding = SourceChunk & { embedding?: number[] };
type RetrievedChunk = SourceChunk & { score: number };

function loadChunks(sourceIds: string[]): ChunkWithEmbedding[] {
  if (sourceIds.length === 0) return [];
  const placeholders = sourceIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT id, sourceId, chunkIndex, kind, text, location, embedding FROM source_chunks WHERE sourceId IN (${placeholders})`)
    .all(...sourceIds) as Array<SourceChunk & { embedding: Buffer | null }>;

  return rows.map((row) => ({
    ...row,
    embedding: row.embedding ? (JSON.parse(row.embedding.toString("utf-8")) as number[]) : undefined,
  }));
}

function buildFtsQuery(terms: string[]): string {
  return terms.map((term) => `"${term.replace(/"/g, "")}"`).join(" OR ");
}

export async function retrieveRelevantChunks({
  sourceIds,
  query,
  limit = config.MAX_SOURCE_CHUNKS_PER_SLIDE,
}: {
  sourceIds: string[];
  query: string;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const chunks = loadChunks(sourceIds);
  if (chunks.length === 0) return [];

  const terms = query.split(/\s+/).filter(Boolean);
  const ftsQuery = buildFtsQuery(terms);

  let keywordRows: SourceChunk[] = [];
  try {
    keywordRows = db
      .prepare(
        `SELECT c.id, c.sourceId, c.index, c.kind, c.text, c.location
         FROM source_chunks_fts fts
         JOIN source_chunks c ON c.rowid = fts.rowid
         WHERE source_chunks_fts MATCH ? AND c.sourceId IN (${sourceIds.map(() => "?").join(",")})
         ORDER BY rank
         LIMIT ?`
      )
      .all(ftsQuery, ...sourceIds, limit * 2) as SourceChunk[];
  } catch {
    // FTS syntax errors fall back to empty keyword results.
    keywordRows = [];
  }

  const chunksNeedingEmbedding = chunks.filter((c) => !c.embedding);
  if (chunksNeedingEmbedding.length > 0) {
    const texts = chunksNeedingEmbedding.map((c) => c.text);
    const embeddings = await getEmbeddings(texts);
    for (let i = 0; i < chunksNeedingEmbedding.length; i++) {
      storeEmbedding(chunksNeedingEmbedding[i].id, texts[i], embeddings[i]);
      chunksNeedingEmbedding[i].embedding = embeddings[i];
    }
  }

  const [queryEmbedding] = await getEmbeddings([query]);

  const semanticScores = new Map<string, number>();
  for (const chunk of chunks) {
    if (!chunk.embedding) continue;
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    semanticScores.set(chunk.id, score);
  }

  const keywordRanks = new Map(keywordRows.map((c, i) => [c.id, i + 1]));
  const semanticRanked = [...semanticScores.entries()].sort((a, b) => b[1] - a[1]);
  const semanticRanks = new Map(semanticRanked.map(([id], i) => [id, i + 1]));

  const fused: RetrievedChunk[] = [];
  for (const chunk of chunks) {
    const kRank = keywordRanks.get(chunk.id) ?? Infinity;
    const sRank = semanticRanks.get(chunk.id) ?? Infinity;
    const score = 1 / (60 + kRank) + 1 / (60 + sRank);
    fused.push({ ...chunk, score });
  }

  fused.sort((a, b) => b.score - a.score);
  return fused.slice(0, limit);
}
