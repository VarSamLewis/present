import { z } from "zod";

export const chartSpecSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bar"),
    title: z.string().optional(),
    xAxis: z.object({ label: z.string().optional(), values: z.array(z.string()) }),
    yAxis: z.object({ label: z.string().optional(), max: z.number().optional() }),
    series: z.array(z.object({ label: z.string(), data: z.array(z.number()) })),
  }),
  z.object({
    type: z.literal("line"),
    title: z.string().optional(),
    xAxis: z.object({ label: z.string().optional(), values: z.array(z.string()) }),
    yAxis: z.object({ label: z.string().optional(), max: z.number().optional() }),
    series: z.array(z.object({ label: z.string(), data: z.array(z.number()) })),
  }),
  z.object({
    type: z.literal("pie"),
    title: z.string().optional(),
    slices: z.array(z.object({ label: z.string(), value: z.number(), color: z.string().optional() })),
  }),
  z.object({
    type: z.literal("timeline"),
    title: z.string().optional(),
    events: z.array(z.object({ label: z.string(), date: z.string(), description: z.string().optional() })),
  }),
  z.object({
    type: z.literal("process"),
    title: z.string().optional(),
    steps: z.array(z.object({ label: z.string(), description: z.string().optional() })),
  }),
  z.object({
    type: z.literal("architecture"),
    title: z.string().optional(),
    nodes: z.array(z.object({ id: z.string(), label: z.string(), x: z.number(), y: z.number(), shape: z.enum(["rect", "circle"]).default("rect") })),
    edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })),
  }),
]);

export type ChartSpec = z.infer<typeof chartSpecSchema>;

export const slideBundleSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  revision: z.number().int().min(1),

  intent: z.object({
    purpose: z.string(),
    primaryMessage: z.string(),
  }),

  content: z.object({
    html: z.string(),
    css: z.string(),
  }),

  data: z.record(z.unknown()).default({}),

  sources: z.array(
    z.object({
      sourceId: z.string(),
      chunkId: z.string(),
      label: z.string(),
    })
  ),

  summary: z.string(),
});

export type SlideBundle = z.infer<typeof slideBundleSchema>;

export const deckManifestSchema = z.object({
  title: z.string(),
  audience: z.string(),
  objective: z.string(),
  styleDirection: z.string(),

  slides: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
      purpose: z.string(),
      primaryMessage: z.string(),
      summary: z.string(),
    })
  ),
});

export type DeckManifest = z.infer<typeof deckManifestSchema>;

export const validationFailureSchema = z.object({
  rule: z.string(),
  message: z.string(),
  element: z.string().optional(),
});

export type ValidationFailure = z.infer<typeof validationFailureSchema>;

export const sourceChunkSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  chunkIndex: z.number().int(),
  text: z.string(),
  kind: z.string(),
  location: z.string().optional(),
});

export type SourceChunk = z.infer<typeof sourceChunkSchema>;
