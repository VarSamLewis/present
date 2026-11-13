# Agent notes for Vibeslide

## Build

```bash
npm install
npx playwright install chromium
npm run build
```

The build script runs `tailwindcss` to generate `public/slide-tailwind.css`, which is inlined into generated slides.

## Run

```bash
npm run dev      # development
npm start        # production (after npm run build)
```

## Testing

```bash
npm run test
```

## Key conventions

- Generated slides use Tailwind CSS utility classes and must be self-contained.
- Slides must not contain JavaScript, external resources, iframes, objects, embeds, or SVG `foreignObject`.
- Server-only modules (`better-sqlite3`, `playwright`, `fs`) are kept out of client components.
- Use the repository layer in `src/lib/db/repositories.ts` for database access.
- LLM provider interface lives in `src/lib/llm/`; OpenAI is the default implementation.
- Add new themes in `src/lib/generation/themes.ts`.
- Add new document parsers in `src/lib/ingestion/parsers/`.

## Environment

Required variables are in `.env.example`. Copy to `.env.local` and fill in OpenAI keys.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
