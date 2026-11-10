import { NextRequest, NextResponse } from "next/server";
import { createDeck, listDecks } from "@/lib/db/repositories";
import { generateManifest } from "@/lib/generation/manifest";

export async function GET() {
  const decks = listDecks();
  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { objective, audience, styleDirection, sourceIds, themeId, generateOutline } = body;

  let title = body.title ?? "Untitled Deck";
  let manifest = null;

  if (generateOutline) {
    manifest = await generateManifest({
      objective,
      audience,
      styleDirection,
      sourceIds,
    });
    title = manifest.title;
  }

  const deck = createDeck({
    title,
    audience,
    objective,
    styleDirection,
    themeId: themeId ?? "clean",
    manifestJson: manifest ? JSON.stringify(manifest) : null,
    sourceIds: Array.isArray(sourceIds) ? sourceIds : [],
  });

  return NextResponse.json({ deck });
}
