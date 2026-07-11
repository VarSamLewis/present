import { NextResponse } from "next/server";
import { listSlideVersions } from "@/lib/db/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const versions = listSlideVersions(id);
  return NextResponse.json({ versions });
}
