import * as xlsx from "xlsx";
import { ParsedDocument, ExtractedBlock } from "@/lib/ingestion/types";

export function parseXlsx(buffer: Buffer): ParsedDocument {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const blocks: ExtractedBlock[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    for (let i = 0; i < json.length; i++) {
      const row = json[i];
      if (!row || row.every((cell) => cell === undefined || cell === "")) continue;

      const text = row.map((cell) => String(cell ?? "")).join(" | ");
      blocks.push({
        kind: "sheet",
        text: `[${sheetName}] ${text}`,
        location: `sheet "${sheetName}" row ${i + 1}`,
      });
    }
  }

  return { blocks };
}
