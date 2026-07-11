import { marked } from "marked";
import { ParsedDocument, ExtractedBlock } from "@/lib/ingestion/types";

export function parseMarkdown(content: string): ParsedDocument {
  const tokens = marked.lexer(content);
  const blocks: ExtractedBlock[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "heading") {
      blocks.push({
        kind: "heading",
        text: token.text,
        location: `heading ${i + 1}`,
      });
    } else if (token.type === "paragraph") {
      blocks.push({
        kind: "paragraph",
        text: token.text,
        location: `paragraph ${i + 1}`,
      });
    } else if (token.type === "list") {
      for (const item of token.items) {
        blocks.push({
          kind: "list",
          text: item.text,
          location: `list ${i + 1}`,
        });
      }
    } else if (token.type === "table") {
      const table = token as { header: { text: string }[]; rows: { text: string }[][] };
      const header = table.header.map((h) => h.text).join(" | ");
      const rows = table.rows.map((row) => row.map((cell) => cell.text).join(" | ")).join("\n");
      blocks.push({
        kind: "table",
        text: `Header: ${header}\n${rows}`,
        location: `table ${i + 1}`,
      });
    }
  }

  return { blocks };
}
