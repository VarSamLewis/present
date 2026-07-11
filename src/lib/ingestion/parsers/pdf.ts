import pdf from "pdf-parse";
import { ParsedDocument, ExtractedBlock } from "@/lib/ingestion/types";

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdf(buffer);
  const blocks: ExtractedBlock[] = [];

  const pages = data.text.split(/\f/);
  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i].trim();
    if (!pageText) continue;

    const lines = pageText.split(/\n/).filter((line) => line.trim());
    const paragraphs = lines.join(" ").split(/\n\s*\n/);

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;
      blocks.push({
        kind: "paragraph",
        text: trimmed,
        location: `page ${i + 1}`,
      });
    }
  }

  return { blocks };
}
