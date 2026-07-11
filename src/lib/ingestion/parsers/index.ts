import { parseText } from "@/lib/ingestion/parsers/text";
import { parseMarkdown } from "@/lib/ingestion/parsers/markdown";
import { parsePdf } from "@/lib/ingestion/parsers/pdf";
import { parseDocx } from "@/lib/ingestion/parsers/docx";
import { parseXlsx } from "@/lib/ingestion/parsers/xlsx";
import { ParsedDocument } from "@/lib/ingestion/types";

export function parseDocument(mimeType: string, buffer: Buffer): Promise<ParsedDocument> | ParsedDocument {
  switch (mimeType) {
    case "text/plain":
      return parseText(buffer.toString("utf-8"));
    case "text/markdown":
    case "text/x-markdown":
      return parseMarkdown(buffer.toString("utf-8"));
    case "application/pdf":
      return parsePdf(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return parseDocx(buffer);
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return parseXlsx(buffer);
    default:
      if (mimeType.startsWith("text/")) {
        return parseText(buffer.toString("utf-8"));
      }
      return parseText(buffer.toString("utf-8"));
  }
}
