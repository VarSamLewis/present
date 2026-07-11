import { NextResponse } from "next/server";
import { getDeck, deleteDeck, listSlides, getCurrentSlideVersion } from "@/lib/db/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = getDeck(id);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const slides = listSlides(id);
  const slideVersions = slides.map((slide) => getCurrentSlideVersion(slide.id));
  const manifest = deck.manifestJson ? JSON.parse(deck.manifestJson) : null;

  return NextResponse.json({ deck, slides, slideVersions, manifest });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteDeck(id);
  return NextResponse.json({ success: true });
}
