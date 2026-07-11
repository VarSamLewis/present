import mammoth from "mammoth";
import { ParsedDocument, ExtractedBlock } from "@/lib/ingestion/types";

export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const blocks: ExtractedBlock[] = [];

  const lines = result.value.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isHeading = line.length < 120 && !line.endsWith(".") && i < lines.length - 1 && lines[i + 1].trim() === "";

    blocks.push({
      kind: isHeading ? "heading" : "paragraph",
      text: line,
      location: `paragraph ${i + 1}`,
    });
  }

  return { blocks };
}
