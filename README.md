# Vibeslide

[![CI](https://github.com/VarSamLewis/present/actions/workflows/ci.yml/badge.svg)](https://github.com/VarSamLewis/present/actions/workflows/ci.yml)

A local-first web application that turns documents into presentations. Each slide is a self-contained bundle of HTML, Tailwind CSS classes, and inline SVG. The app runs entirely on your machine and calls external APIs only for LLM generation and embeddings.

## Guides

- **[User Guide](docs/user-guide.md)** — setup, workflow, tips, troubleshooting
- **[Deployment Guide](docs/deployment.md)** — Docker, bare-metal servers, TLS, auth, backups
- **[Commands](docs/command.md)** — install, run, test, Docker, Railway, backups

## Quick start

```bash
nvm use
npm install
npx playwright install chromium
npm run build
npm start        # http://localhost:3000
```

Then open **Settings** in the app and paste your OpenAI-compatible API key — no `.env` file required.

Or with Docker:

```bash
docker compose up -d --build
```

Or deploy to [Railway](https://railway.com) — it builds the Dockerfile and runs
the `/api/health` check (mount a volume at `/app/data`; see the
[Deployment Guide](docs/deployment.md#option-b-railway)).

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

No `.env.local` is required. API keys are configured in the app under **Settings** (`/settings`) —
bring your own OpenAI-compatible key and it is stored in the local database.

Optionally, copy `.env.example` to `.env.local` to tune storage paths, the embedding model, or the
generation pipeline. To require sign-in on a hosted install, set the Clerk keys (see the
[Deployment Guide](docs/deployment.md#authentication-optional-but-recommended-for-hosted-installs)).
`npm run dev` on localhost skips sign-in even when those keys are set.

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
  proxy.ts                Request gate (Clerk sign-in when configured)
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
    settings.ts           Runtime AI configuration (BYOK)
    auth.ts               Auth gate state helper
    schemas.ts            Zod schemas
```

## Creating a presentation

1. Go to **Settings** and paste your OpenAI-compatible API key (base URL and model are configurable too).
2. Go to **Sources** and upload files.
3. Go to **New Deck**, enter the objective, select sources, and create the deck.
4. In the editor click **Generate**.
5. Revise slides via chat, reorder them, or edit HTML directly.
6. Use **Present** for full-screen mode or **Export PDF** to download the deck.

See the [User Guide](docs/user-guide.md) for details.

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
