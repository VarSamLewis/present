import { ParsedDocument, ExtractedBlock } from "@/lib/ingestion/types";

export function parseText(content: string): ParsedDocument {
  const blocks: ExtractedBlock[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    blocks.push({
      kind: "paragraph",
      text: line,
      location: `line ${i + 1}`,
    });
  }

  return { blocks };
}
