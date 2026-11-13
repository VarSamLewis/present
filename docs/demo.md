# Demo walkthrough

A 10-minute script that shows the whole loop: a document goes in, a deck comes
out, you revise a slide, present it, and export a PDF.

## What you need

- An OpenAI key (or any OpenAI-compatible endpoint that supports
  `response_format: json_schema` and embeddings).
- The repo checked out and dependencies installed.
- About 5 minutes of pre-flight before the audience arrives.

## Pre-flight

Run these from the repository root. On NixOS, `nix develop` gives you Node 22
and a working Chromium for Playwright.

```bash
nix develop
npm ci
npm run dev
```

Then:

1. Open <http://localhost:3000/settings>.
2. Paste your API key, leave the base URL as `https://api.openai.com/v1`, and
   set the model to `gpt-4o`.
3. Click **Test connection** — it should say **Connection OK.**
4. Open <http://localhost:3000/sources> and upload the sample files:
   - `docs/samples/northwind-q3-review.md` (narrative + tables)
   - `docs/samples/northwind-q3-metrics.xlsx` (two sheets of metrics)

Both uploads should appear immediately. Click one to see the parsed chunks and
their locations; that is what generation retrieves from.

> **Do a backup run.** Generation is sequential and can take a minute or two.
> Before the demo, create a deck and click **Generate Deck** once. Keep that
> deck. If the live run is slow or the network misbehaves, present the
> pre-generated deck instead.

Sanity check:

```bash
curl -s localhost:3000/api/health   # {"ok":true,"configured":true}
```

## The live script

| Time | Do this | Say this |
|---|---|---|
| 0:00 | Show the home page | "Vibeslide is local-first: documents and the database stay on this machine. The only outbound calls are to the LLM endpoint you configure." |
| 0:30 | Show **Settings** | "The key is stored in the local SQLite database, not in the repo or a browser cookie. Any OpenAI-compatible endpoint works." |
| 1:00 | Open **Sources**, click the uploaded brief | "Uploads are parsed into structured blocks — headings, paragraphs, tables, spreadsheet rows. Each block is chunked and embedded, so slides can cite the part of the document they came from." |
| 2:00 | **New Deck** | Fill in the fields below, tick both sources, click **Create Deck**. |
| 3:00 | Click **Generate Deck** | "First it writes a deck manifest — title, audience, and an ordered outline. Then it generates each slide independently against the retrieved source chunks and validates the HTML/CSS before saving." |
| 5:00 | When slides appear, select one | Point out the live 16:9 preview, the citations panel, and that each slide is self-contained HTML + Tailwind + inline SVG. |
| 6:00 | Use **Revision chat** | Try: "Make the headline shorter and replace the table with three key numbers." Then **Regenerate**. |
| 7:00 | Show **Direct edit** | "You can also edit the HTML or CSS by hand; blurring the field saves a new revision." |
| 8:00 | Click **Present** | Use <kbd>→</kbd>/<kbd>Space</kbd> to advance, <kbd>←</kbd> to go back, <kbd>F</kbd> for fullscreen, <kbd>Esc</kbd> to exit. |
| 9:00 | Back in the editor, click **Export PDF** | "Playwright renders the slide in Chromium and returns a PDF." |
| 9:30 | Show `data/` | "Everything — SQLite, uploads, exports — lives in this one directory. Back it up and you have the whole app state." |

### Suggested deck inputs

- **Objective:** "Persuade the leadership team to approve the Q4 investment plan
  in the attached Q3 business review."
- **Audience:** "Executive leadership team"
- **Style direction:** "clean, data-forward, executive — 6 to 8 slides"
- **Sources:** both sample files

The "6 to 8 slides" hint matters: the manifest schema allows up to 30 slides,
and a capable model will happily write that many. Fewer slides = a faster,
tighter demo.

## Demo gotchas

| Symptom | Cause / fix |
|---|---|
| **Generate Deck** fails with a model error | The endpoint or model does not support `response_format: json_schema` with `strict: true`. Use `gpt-4o` or another structured-output model. |
| Generation is slow | Slides are generated sequentially on purpose (each one sees the previous slide's summary). Pre-generate a backup deck, or use a shorter objective. |
| Upload parses but generation complains about embeddings | The embedding model is fixed to `text-embedding-3-small`. For a non-OpenAI endpoint, set `EMBEDDING_MODEL` in `.env.local` to a model that endpoint serves. |
| **Export PDF** fails or is blank | Chromium is missing. Run the app inside `nix develop` (or `npx playwright install chromium` on bare metal). |
| PDF has one page | Known MVP limitation: export currently renders only the first slide. Present in the browser for the full deck. |
| Sign-in redirects appear | Clerk keys are set. `npm run dev` bypasses them on localhost; if you are on a custom hostname, unset the keys or use localhost. |
| `EADDRINUSE :3000` | `npm run dev -- -p 3100`, then use <http://localhost:3100>. |

## Reset between demos

Stop the dev server first, then move the data directory aside:

```bash
mv data "data.backup-$(date +%s)"
npm run dev
```

That gives you a clean database, no sources, and no saved key. To wipe
everything instead (destructive, no undo):

```bash
rm -rf data
```

Migrations run automatically on the first request, so a fresh `data/` is fine.

## Optional: show the auth gate

By default the demo needs no login. To show the optional Clerk gate, set both
keys and run a production build (development bypasses the gate on localhost):

```bash
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
export CLERK_SECRET_KEY=sk_test_...
npm run build && npm start
```

Then `/` redirects to `/sign-in`, API routes return `401` when signed out, and
`/api/health` stays public. See the
[Deployment Guide](deployment.md#authentication-optional-but-recommended-for-hosted-installs).
