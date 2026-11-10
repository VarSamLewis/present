import crypto from "crypto";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import DOMPurify from "isomorphic-dompurify";
import postcss from "postcss";
import safeParser from "postcss-safe-parser";
import { DeckManifest, SlideBundle, chartSpecSchema } from "@/lib/schemas";
import { Theme } from "@/lib/generation/themes";
import { getLLMProvider } from "@/lib/llm";
import { slidePrompt, repairPrompt } from "@/lib/generation/prompts";
import { retrieveRelevantChunks } from "@/lib/generation/retrieval";
import { chartToSvg } from "@/lib/charts";
import { validateSlide } from "@/lib/rendering/validation";
import { renderSlideToFailures } from "@/lib/rendering/renderer";
import { config } from "@/lib/config";

const generatedSlideSchema = z.object({
  intent: z.object({ purpose: z.string(), primaryMessage: z.string() }),
  content: z.object({ html: z.string(), css: z.string() }),
  data: z.record(z.unknown()).default({}),
  sources: z.array(z.object({ sourceId: z.string(), chunkId: z.string(), label: z.string() })),
  summary: z.string(),
});

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true },
    FORBID_ATTR: ["style", "onclick", "onload", "onerror", "onmouseover"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "foreignObject"],
  });
}

async function validateCss(css: string): Promise<string> {
  try {
    await postcss().process(css, { from: undefined, parser: safeParser });
    return css;
  } catch {
    // If parsing fails, return empty CSS and let the renderer catch layout issues.
    return "";
  }
}

function replaceCharts(html: string, data: Record<string, unknown>): string {
  const chart = data.chart;
  if (!chart) return html;

  const parsed = chartSpecSchema.safeParse(chart);
  if (!parsed.success) return html;

  const svg = chartToSvg(parsed.data);
  return html.replace(/<div[^>]*data-chart[^>]*>.*?<\/div>/gi, svg) || html + svg;
}

export async function generateSlideBundle({
  deckId,
  manifest,
  theme,
  slideManifest,
  sourceIds,
  revisionInstruction,
  currentVersion,
}: {
  deckId: string;
  manifest: DeckManifest;
  theme: Theme;
  slideManifest: DeckManifest["slides"][number];
  sourceIds: string[];
  revisionInstruction?: string;
  currentVersion?: SlideBundle;
}): Promise<SlideBundle> {
  const relevant = await retrieveRelevantChunks({
    sourceIds,
    query: `${slideManifest.purpose} ${slideManifest.primaryMessage}`,
  });

  const previous = manifest.slides.find((s) => s.order === slideManifest.order - 1) ?? null;
  const next = manifest.slides.find((s) => s.order === slideManifest.order + 1) ?? null;

  const provider = getLLMProvider();
  const schema = zodToJsonSchema(generatedSlideSchema);

  const result = await provider.generateObject<z.infer<typeof generatedSlideSchema>>(
    [
      { role: "system", content: "You generate presentation slides as JSON with Tailwind CSS classes." },
      {
        role: "user",
        content: slidePrompt({
          manifest,
          theme,
          slide: slideManifest,
          previous,
          next,
          sourceExcerpts: relevant.map((r) => `[${r.location ?? "source"}] ${r.text}`),
          revisionInstruction,
          currentHtml: currentVersion?.content.html,
          currentCss: currentVersion?.content.css,
        }),
      },
    ],
    schema
  );

  let html = sanitizeHtml(result.content.html);
  const css = await validateCss(result.content.css);
  html = replaceCharts(html, result.data);

  const bundle: SlideBundle = {
    id: currentVersion?.id ?? crypto.randomUUID(),
    deckId,
    revision: (currentVersion?.revision ?? 0) + 1,
    intent: result.intent,
    content: { html, css },
    data: result.data,
    sources: result.sources,
    summary: result.summary,
  };

  return repairIfNeeded(bundle, manifest, theme, slideManifest);
}

async function repairIfNeeded(
  bundle: SlideBundle,
  manifest: DeckManifest,
  theme: Theme,
  slideManifest: DeckManifest["slides"][number]
): Promise<SlideBundle> {
  for (let attempt = 0; attempt < config.MAX_SLIDE_REPAIR_ATTEMPTS; attempt++) {
    const failures = await renderSlideToFailures(bundle, theme);
    if (failures.length === 0) break;

    const provider = getLLMProvider();
    const schema = zodToJsonSchema(generatedSlideSchema);

    const result = await provider.generateObject<z.infer<typeof generatedSlideSchema>>(
      [
        { role: "system", content: "You repair presentation slides based on validation feedback." },
        {
          role: "user",
          content: repairPrompt({
            manifest,
            theme,
            slide: slideManifest,
            currentHtml: bundle.content.html,
            currentCss: bundle.content.css,
            failures,
          }),
        },
      ],
      schema
    );

    let html = sanitizeHtml(result.content.html);
    const css = await validateCss(result.content.css);
    html = replaceCharts(html, result.data);

    bundle = {
      ...bundle,
      revision: bundle.revision + 1,
      intent: result.intent,
      content: { html, css },
      data: result.data,
      sources: result.sources,
      summary: result.summary,
    };
  }

  return bundle;
}

export { validateSlide };
