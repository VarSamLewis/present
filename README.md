# Vibeslide

A local-first web application that turns documents into presentations. Each slide is a self-contained bundle of HTML, Tailwind CSS classes, and inline SVG. The app runs entirely on your machine and calls external APIs only for LLM generation and embeddings.

## What it does

- Upload documents (PDF, DOCX, XLSX, Markdown, TXT).
- Describe your presentation objective and pick sources.
- Generate a deck outline and each slide independently.
- Revise individual slides through chat.
- Preview, present, and export the deck to PDF.

## Architecture snapshot

- Next.js (app router) + React + TypeScript
- Tailwind CSS v3 for generated slide styling
- SQLite for structured state (`sources`, `source_chunks`, `decks`, `slides`, `slide_versions`)
- Local filesystem for uploads, screenshots, and exports
- OpenAI API for generation and embeddings
- Playwright + Chromium for rendering, validation, and PDF export
- Zod for structured output, DOMPurify for sanitization, PostCSS for CSS validation

## Prerequisites

This project assumes `nvm` is installed.

```bash
# Use the Node version pinned in .nvmrc
nvm install
nvm use

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in your keys.

```bash
# Storage
DATABASE_PATH=./data/vibeslide.db
DATA_DIRECTORY=./data

# OpenAI / embeddings
EMBEDDING_API_URL=https://api.openai.com/v1/embeddings
EMBEDDING_API_KEY=<your-key>
EMBEDDING_MODEL=text-embedding-3-small

AI_PROVIDER=openai
AI_GENERATION_MODEL=gpt-4o
AI_API_KEY=<your-key>

# Pipeline tuning
MAX_SOURCE_CHUNKS_PER_SLIDE=8
MAX_SLIDE_REPAIR_ATTEMPTS=2
SLIDE_GENERATION_CONCURRENCY=2
```

## Running locally

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

The first build also generates `public/slide-tailwind.css`, a self-contained Tailwind bundle that is inlined into generated slides.

The app runs at `http://localhost:3000` by default.

## Project structure

```text
src/
  app/                    Next.js app router pages
  components/             Shared React components
  lib/
    db/                   SQLite schema, migrations, queries
    storage/              Filesystem helpers
    ingestion/            Document parsers and chunking
    embeddings/           Embedding API client and cache
    llm/                  Provider adapter and OpenAI implementation
    generation/           Deck manifest and slide generation
    charts/               Custom chart spec → SVG converter
    rendering/            Playwright rendering and validation
    export/               PDF export
    config.ts             Environment config
    schemas.ts            Zod schemas
```

## Creating a presentation

1. Go to **Sources** and upload files.
2. Go to **New Deck**, enter the objective, select sources, and pick a theme.
3. Review the generated outline.
4. Click **Generate Deck**.
5. Open the **Editor** to revise slides, reorder them, or regenerate visuals.
6. Use **Present** for full-screen mode or **Export** to download a PDF.

## Development notes

- Generated slides use Tailwind utility classes. A pre-built Tailwind bundle is inlined into each slide so slides remain self-contained and runnable without external resources.
- Slides do not contain JavaScript.
- Each slide is generated independently; the LLM sees only the compact deck manifest, adjacent slide summaries, and relevant source excerpts.
- Direct edits in the editor create a new `slide_versions` row and update the current version reference.

## Extending

- **New LLM provider**: implement the provider interface in `src/lib/llm/` and register it in `src/lib/llm/index.ts`.
- **New document parser**: add a driver in `src/lib/ingestion/parsers/`.
- **New theme**: add theme tokens in `src/lib/generation/themes/` and add it to the theme selector.

## License

MIT
