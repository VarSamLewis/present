Build a local-first web application called **Vibeslide** that generates and edits presentations as HTML, CSS, and inline SVG.

## Objective

The application should let a user:

1. Upload documents and data.
2. Create a presentation from those sources.
3. Generate each slide independently.
4. Revise individual slides through chat.
5. Present the deck in the browser.
6. Export the deck to PDF.

The application runs locally and uses external APIs for LLM generation and embeddings.

## Core architecture

Use:

- Next.js
- React
- TypeScript
- SQLite
- Local filesystem storage
- An external embedding model API
- An external coding-capable LLM API
- Playwright and Chromium
- Zod
- DOMPurify
- PostCSS

Run everything through a single Next.js application.

## Slide format

Each slide must be self-contained.

A slide contains:

- HTML
- CSS
- Inline SVG
- Structured data
- Source citations
- A short summary of its purpose

Slides must not contain JavaScript.

A slide must not depend on another slide’s HTML, CSS, or SVG.

Use a fixed viewport:

```ts
{
  width: 1600,
  height: 900
}
```

Store each slide as a versioned bundle:

```ts
type SlideBundle = {
  id: string;
  deckId: string;
  revision: number;

  intent: {
    purpose: string;
    primaryMessage: string;
  };

  content: {
    html: string;
    css: string;
  };

  data: Record<string, unknown>;

  sources: Array<{
    sourceId: string;
    chunkId: string;
    label: string;
  }>;

  summary: string;
};
```

## Deck format

Store a compact deck manifest:

```ts
type DeckManifest = {
  title: string;
  audience: string;
  objective: string;
  styleDirection: string;

  slides: Array<{
    id: string;
    order: number;
    purpose: string;
    primaryMessage: string;
    summary: string;
  }>;
};
```

Do not send the complete deck HTML to the LLM when generating or revising one slide.

For each slide, send only:

- Deck objective
- Theme tokens
- Compact deck manifest
- Current slide purpose
- Previous slide summary
- Next slide summary
- Relevant source excerpts
- Current slide HTML and CSS when revising
- User instruction

## Document ingestion

Support:

- PDF
- DOCX
- XLSX
- Markdown
- Plain text

Extract headings, paragraphs, tables, sheet names, ranges, and source locations.

Chunk the extracted content and store it in SQLite.

Generate embeddings through an external embedding model API.

Store:

```text
sources
source_chunks
decks
slides
slide_versions
```

Use SQLite FTS5 for keyword search.

Use stored embeddings for semantic search.

Combine keyword and semantic retrieval before sending source excerpts to the LLM.

Cache embeddings using a content hash so unchanged content is not re-embedded.

## Slide generation

```text
Upload sources
→ parse content
→ create chunks
→ generate embeddings through API
→ create deck manifest
→ generate each slide independently
→ sanitize HTML, CSS, and SVG
→ render in Chromium
→ validate layout
→ repair failing slides
→ present or export
```

Generate slides sequentially or with low in-process concurrency.

## SVG

Use inline SVG for:

- Charts
- Timelines
- Process diagrams
- Architecture diagrams
- Icons
- Illustrations
- Decorative visuals

For charts, prefer a structured chart specification that the application converts into static SVG.

The stored slide must contain the final SVG and must not require a charting library at runtime.

## Rendering

Render each slide inside a sandboxed iframe using `srcdoc`.

Do not allow:

- Scripts
- Inline event handlers
- Remote stylesheets
- Remote fonts
- External network requests
- `iframe`
- `object`
- `embed`
- SVG `foreignObject`
- CSS `@import`

Use DOMPurify for HTML and SVG sanitization.

Use PostCSS to validate generated CSS.

## Validation

Use Playwright and browser measurements to detect:

- Overflow
- Clipped text
- Elements outside the viewport
- Overlapping elements
- Text below minimum font size
- Excessive text density
- SVG content outside its viewBox
- External resources
- Unsupported markup or CSS

Return structured validation failures to the LLM and ask it to repair only the affected slide.

## Interface

### Sources

- Upload files
- View indexed files
- Remove files
- Inspect extracted text

### Deck creation

- Enter presentation objective
- Select sources
- Choose a theme
- Review the outline
- Generate the deck

### Editor

- Slide thumbnail rail
- Full-size slide preview
- Direct text editing
- Slide-local revision chat
- Reorder slides
- Duplicate or delete slides
- Regenerate one slide
- Regenerate one visual
- View citations
- Restore earlier revisions

### Presentation

- Full-screen browser mode
- Keyboard navigation
- Speaker notes
- PDF export

## Local storage

```text
data/
  vibeslide.db

  uploads/
    <source-id>/
      original-file

  decks/
    <deck-id>/
      screenshots/
      exports/
```

Store structured state in SQLite and larger artifacts on the local filesystem.

## Environment variables

```text
DATABASE_PATH=./data/vibeslide.db
DATA_DIRECTORY=./data

EMBEDDING_API_URL=<embedding-api-url>
EMBEDDING_API_KEY=<embedding-api-key>
EMBEDDING_MODEL=<embedding-model>

AI_PROVIDER=<provider>
AI_GENERATION_MODEL=<model>
AI_API_KEY=<key>

MAX_SOURCE_CHUNKS_PER_SLIDE=8
MAX_SLIDE_REPAIR_ATTEMPTS=2
SLIDE_GENERATION_CONCURRENCY=2
```

## Main design rule

The application uses JavaScript.

Generated slides do not.

Each slide is an isolated HTML, CSS, and SVG document that can be generated, revised, validated, rendered, and exported without loading the complete deck into the LLM context.
