import { DeckManifest } from "@/lib/schemas";
import { Theme } from "@/lib/generation/themes";

type AdjacentSlide = { order: number; purpose: string; primaryMessage: string; summary: string } | null;

export function manifestPrompt(objective: string, audience: string, styleDirection: string, sourceExcerpts: string[]): string {
  return `You are creating a presentation deck.

Objective: ${objective}
Audience: ${audience}
Style direction: ${styleDirection}

Relevant source excerpts:
${sourceExcerpts.map((ex) => `- ${ex}`).join("\n")}

Create a deck manifest with:
- title: a compelling title
- audience: the intended audience
- objective: the presentation objective
- styleDirection: the visual style direction
- slides: an ordered array of slides. Each slide needs id (uuid), order, purpose, primaryMessage, summary.

Return only a JSON object matching the schema.`;
}

export function slidePrompt(options: {
  manifest: DeckManifest;
  theme: Theme;
  slide: DeckManifest["slides"][number];
  previous: AdjacentSlide;
  next: AdjacentSlide;
  sourceExcerpts: string[];
  revisionInstruction?: string;
  currentHtml?: string;
  currentCss?: string;
}): string {
  const adjacent = [];
  if (options.previous) {
    adjacent.push(`Previous slide (#${options.previous.order}): ${options.previous.summary}`);
  }
  if (options.next) {
    adjacent.push(`Next slide (#${options.next.order}): ${options.next.summary}`);
  }

  const revisionSection = options.revisionInstruction
    ? `\nThis is a revision. User instruction: ${options.revisionInstruction}\nCurrent HTML:\n${options.currentHtml ?? ""}\nCurrent CSS:\n${options.currentCss ?? ""}`
    : "";

  return `You are generating a single slide for a presentation deck.

Deck objective: ${options.manifest.objective}
Deck title: ${options.manifest.title}
Audience: ${options.manifest.audience}
Style direction: ${options.manifest.styleDirection}

Theme:
- background: ${options.theme.tokens.background}
- surface: ${options.theme.tokens.surface}
- text: ${options.theme.tokens.text}
- text muted: ${options.theme.tokens.textMuted}
- primary: ${options.theme.tokens.primary}
- secondary: ${options.theme.tokens.secondary}
- accent: ${options.theme.tokens.accent}
- border: ${options.theme.tokens.border}
- heading font: ${options.theme.tokens.fontHeading}
- body font: ${options.theme.tokens.fontBody}

Slide purpose: ${options.slide.purpose}
Slide primary message: ${options.slide.primaryMessage}

${adjacent.join("\n")}

Relevant source excerpts:
${options.sourceExcerpts.map((ex) => `- ${ex}`).join("\n")}
${revisionSection}

Generate the slide as a JSON object with:
- intent.purpose
- intent.primaryMessage
- content.html: a single HTML fragment using Tailwind CSS utility classes. The slide is rendered inside a 1600x900 container. Do not use arbitrary values if possible; prefer standard Tailwind utilities. You may use inline SVG for charts, diagrams, icons, or illustrations.
- content.css: a small custom CSS block for things Tailwind cannot express, or empty string. No @import, no external URLs, no animations that require JS.
- data: optional structured data object; if you include a chart, put a chartSpec here under key "chart" with type "bar" | "line" | "pie" | "timeline" | "process" | "architecture".
- sources: array of source references from the excerpts (sourceId, chunkId, label).
- summary: a one-sentence summary of the slide.

Rules:
- No JavaScript.
- No inline event handlers.
- No external resources.
- No iframes, objects, embeds, or SVG foreignObject.
- Keep text readable and avoid overcrowding.
- Ensure all content fits in 1600x900.

Return only JSON.`;
}

export function repairPrompt(options: {
  manifest: DeckManifest;
  theme: Theme;
  slide: DeckManifest["slides"][number];
  currentHtml: string;
  currentCss: string;
  failures: Array<{ rule: string; message: string; element?: string }>;
}): string {
  return `The following slide failed validation. Please repair it.

Deck objective: ${options.manifest.objective}
Slide purpose: ${options.slide.purpose}
Slide primary message: ${options.slide.primaryMessage}

Current HTML:\n${options.currentHtml}\nCurrent CSS:\n${options.currentCss}

Validation failures:
${options.failures.map((f) => `- ${f.rule}: ${f.message}${f.element ? ` (${f.element})` : ""}`).join("\n")}

Return the repaired slide as the same JSON structure: content.html, content.css, summary, sources, data.`;
}
