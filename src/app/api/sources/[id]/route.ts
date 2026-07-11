import { NextResponse } from "next/server";
import { getSource, deleteSource, getChunksBySource } from "@/lib/db/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = getSource(id);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
  const chunks = getChunksBySource(id);
  return NextResponse.json({ source, chunks });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteSource(id);
  return NextResponse.json({ success: true });
}
