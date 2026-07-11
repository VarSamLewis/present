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
