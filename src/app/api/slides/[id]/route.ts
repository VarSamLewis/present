import { NextRequest, NextResponse } from "next/server";
import { getSlide, getSlideVersion, createSlideVersion, updateSlideCurrentVersion, updateSlideOrder, deleteSlide } from "@/lib/db/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slide = getSlide(id);
  if (!slide) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  const version = slide.currentVersionId ? getSlideVersion(slide.currentVersionId) : undefined;
  return NextResponse.json({ slide, version });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body.orderIndex === "number") {
    updateSlideOrder(id, body.orderIndex);
  }

  if (body.version) {
    const slide = getSlide(id);
    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const current = slide.currentVersionId ? getSlideVersion(slide.currentVersionId) : undefined;
    const revision = (current?.revision ?? 0) + 1;

    const version = createSlideVersion({
      slideId: id,
      deckId: slide.deckId,
      revision,
      purpose: body.version.purpose ?? current?.purpose ?? "",
      primaryMessage: body.version.primaryMessage ?? current?.primaryMessage ?? "",
      summary: body.version.summary ?? current?.summary ?? "",
      html: body.version.html ?? current?.html ?? "",
      css: body.version.css ?? current?.css ?? "",
      data: JSON.stringify(body.version.data ?? (current ? JSON.parse(current.data) : {})),
      sources: JSON.stringify(body.version.sources ?? (current ? JSON.parse(current.sources) : [])),
    });

    updateSlideCurrentVersion(id, version.id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteSlide(id);
  return NextResponse.json({ success: true });
}
