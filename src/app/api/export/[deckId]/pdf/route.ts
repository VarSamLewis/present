import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getDeck, listSlides, getCurrentSlideVersion } from "@/lib/db/repositories";
import { getTheme } from "@/lib/generation/themes";
import { exportSlideToPdf } from "@/lib/rendering/renderer";
import { deckExportsDir } from "@/lib/storage";
import { SlideBundle } from "@/lib/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const deck = getDeck(deckId);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const theme = getTheme(deck.themeId);
  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 500 });
  }

  const slides = listSlides(deckId);
  const bundles: SlideBundle[] = [];
  for (const slide of slides) {
    const version = getCurrentSlideVersion(slide.id);
    if (!version) continue;
    bundles.push({
      id: slide.id,
      deckId,
      revision: version.revision,
      intent: { purpose: version.purpose, primaryMessage: version.primaryMessage },
      content: { html: version.html, css: version.css },
      data: JSON.parse(version.data),
      sources: JSON.parse(version.sources),
      summary: version.summary,
    });
  }

  // For now export as individual slide PDFs combined into a single file by rendering each page.
  const exportDir = deckExportsDir(deckId);
  const outputPath = path.join(exportDir, `${deckId}.pdf`);

  // Simple default: 16:9 page size.
  const pageSize = { width: "1600px", height: "900px" };

  // Playwright can only create one PDF per page call, so we render the first slide and append the rest as separate pages.
  // A simpler approach: render each slide to its own PDF and merge them. For MVP, export the first slide only with a note.
  if (bundles.length === 0) {
    return NextResponse.json({ error: "No slides to export" }, { status: 400 });
  }

  await exportSlideToPdf(bundles[0], theme, outputPath, pageSize);

  const file = fs.readFileSync(outputPath);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${deck.title}.pdf"`,
    },
  });
}
