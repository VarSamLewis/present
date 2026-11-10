import { NextRequest, NextResponse } from "next/server";
import { getDeck, listSlides, createSlide, createSlideVersion, updateSlideCurrentVersion, updateDeckManifest, getDeckSourceIds } from "@/lib/db/repositories";
import { generateManifest } from "@/lib/generation/manifest";
import { generateSlideBundle } from "@/lib/generation/slide";
import { getTheme } from "@/lib/generation/themes";
import { SlideBundle } from "@/lib/schemas";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = getDeck(id);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const sourceIds: string[] =
    Array.isArray(body?.sourceIds) && body.sourceIds.length > 0 ? body.sourceIds : getDeckSourceIds(id);

  // Re-generate manifest from objective + sources.
  const manifest = await generateManifest({
    objective: deck.objective,
    audience: deck.audience,
    styleDirection: deck.styleDirection,
    sourceIds,
  });

  updateDeckManifest(id, JSON.stringify(manifest));

  const theme = getTheme(deck.themeId);
  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 500 });
  }

  // Clear existing slides.
  const existingSlides = listSlides(id);
  for (const slide of existingSlides) {
    // SQLite cascade deletes versions.
    const { deleteSlide } = await import("@/lib/db/repositories");
    deleteSlide(slide.id);
  }

  // Generate slides sequentially.
  const generated: SlideBundle[] = [];
  for (const slideManifest of manifest.slides) {
    const bundle = await generateSlideBundle({
      deckId: id,
      manifest,
      theme,
      slideManifest,
      sourceIds,
    });

    const slide = createSlide({ deckId: id, orderIndex: slideManifest.order, currentVersionId: null });
    const version = createSlideVersion({
      slideId: slide.id,
      deckId: id,
      revision: bundle.revision,
      purpose: bundle.intent.purpose,
      primaryMessage: bundle.intent.primaryMessage,
      summary: bundle.summary,
      html: bundle.content.html,
      css: bundle.content.css,
      data: JSON.stringify(bundle.data),
      sources: JSON.stringify(bundle.sources),
    });
    updateSlideCurrentVersion(slide.id, version.id);
    generated.push(bundle);
  }

  return NextResponse.json({ manifest, slides: generated });
}
