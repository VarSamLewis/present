import { NextRequest, NextResponse } from "next/server";
import { getSlide, getSlideVersion, createSlideVersion, updateSlideCurrentVersion, getDeck, getDeckSourceIds } from "@/lib/db/repositories";
import { generateSlideBundle } from "@/lib/generation/slide";
import { getTheme } from "@/lib/generation/themes";
import { deckManifestSchema } from "@/lib/schemas";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slide = getSlide(id);
  if (!slide) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  const deck = getDeck(slide.deckId);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const manifest = deckManifestSchema.parse(body.manifest);
  const sourceIds: string[] =
    Array.isArray(body?.sourceIds) && body.sourceIds.length > 0 ? body.sourceIds : getDeckSourceIds(deck.id);
  const instruction: string | undefined = body.instruction;

  const theme = getTheme(deck.themeId);
  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 500 });
  }

  const slideManifest = manifest.slides.find((s) => s.id === id);
  if (!slideManifest) {
    return NextResponse.json({ error: "Slide not in manifest" }, { status: 400 });
  }

  const currentVersion = slide.currentVersionId ? getSlideVersion(slide.currentVersionId) : undefined;
  const currentBundle = currentVersion
    ? {
        id: slide.id,
        deckId: slide.deckId,
        revision: currentVersion.revision,
        intent: {
          purpose: currentVersion.purpose,
          primaryMessage: currentVersion.primaryMessage,
        },
        content: { html: currentVersion.html, css: currentVersion.css },
        data: JSON.parse(currentVersion.data),
        sources: JSON.parse(currentVersion.sources),
        summary: currentVersion.summary,
      }
    : undefined;

  const bundle = await generateSlideBundle({
    deckId: slide.deckId,
    manifest,
    theme,
    slideManifest,
    sourceIds,
    revisionInstruction: instruction,
    currentVersion: currentBundle,
  });

  const version = createSlideVersion({
    slideId: id,
    deckId: slide.deckId,
    revision: bundle.revision,
    purpose: bundle.intent.purpose,
    primaryMessage: bundle.intent.primaryMessage,
    summary: bundle.summary,
    html: bundle.content.html,
    css: bundle.content.css,
    data: JSON.stringify(bundle.data),
    sources: JSON.stringify(bundle.sources),
  });

  updateSlideCurrentVersion(id, version.id);

  return NextResponse.json({ bundle, version });
}
