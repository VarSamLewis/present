import crypto from "crypto";
import { ExtractedBlock } from "@/lib/ingestion/types";
import { SourceChunk } from "@/lib/schemas";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function splitText(text: string, maxLength: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxLength, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }

  return chunks;
}

export function chunkBlocks(sourceId: string, blocks: ExtractedBlock[]): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  let chunkIndex = 0;

  for (const block of blocks) {
    const pieces = block.text.length > CHUNK_SIZE
      ? splitText(block.text, CHUNK_SIZE, CHUNK_OVERLAP)
      : [block.text];

    for (const piece of pieces) {
      chunks.push({
        id: crypto.randomUUID(),
        sourceId,
        chunkIndex: chunkIndex++,
        kind: block.kind,
        text: piece,
        location: block.location,
      });
    }
  }

  return chunks;
}
