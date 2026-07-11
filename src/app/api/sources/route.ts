import { NextRequest, NextResponse } from "next/server";
import { createSource, listSources, insertChunks } from "@/lib/db/repositories";
import { parseDocument } from "@/lib/ingestion/parsers";
import { chunkBlocks } from "@/lib/ingestion/chunker";
import { writeSourceFile } from "@/lib/storage";

export async function GET() {
  const sources = listSources();
  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const source = createSource({
    name: file.name,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buffer.length,
  });

  writeSourceFile(source.id, file.name, buffer);

  const parsed = await parseDocument(source.mimeType, buffer);
  const chunks = chunkBlocks(source.id, parsed.blocks);
  insertChunks(chunks);

  return NextResponse.json({ source });
}
