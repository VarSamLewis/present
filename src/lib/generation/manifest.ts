import crypto from "crypto";
import { zodToJsonSchema } from "zod-to-json-schema";
import { DeckManifest, deckManifestSchema } from "@/lib/schemas";
import { getLLMProvider } from "@/lib/llm";
import { manifestPrompt } from "@/lib/generation/prompts";
import { retrieveRelevantChunks } from "@/lib/generation/retrieval";

export async function generateManifest({
  objective,
  audience,
  styleDirection,
  sourceIds,
}: {
  objective: string;
  audience: string;
  styleDirection: string;
  sourceIds: string[];
}): Promise<DeckManifest> {
  const excerpts = await retrieveRelevantChunks({ sourceIds, query: objective, limit: 16 });
  const provider = getLLMProvider();

  const schema = zodToJsonSchema(
    deckManifestSchema.extend({
      slides: deckManifestSchema.shape.slides.element.array().min(1).max(30),
    })
  );

  const result = await provider.generateObject<DeckManifest>(
    [
      { role: "system", content: "You generate presentation deck manifests as JSON." },
      {
        role: "user",
        content: manifestPrompt(
          objective,
          audience,
          styleDirection,
          excerpts.map((e) => e.text)
        ),
      },
    ],
    schema
  );

  const parsed = deckManifestSchema.parse(result);

  // Ensure IDs and orders are stable.
  parsed.slides = parsed.slides.map((slide, index) => ({
    ...slide,
    id: slide.id || crypto.randomUUID(),
    order: index + 1,
  }));

  return parsed;
}
