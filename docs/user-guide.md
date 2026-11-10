# User Guide

Vibeslide turns your documents into finished presentations. You describe what
the deck is for, pick the source files, and the app generates an outline and
then each slide — complete with layout, styling, and charts — which you can
refine, present, and export to PDF.

**Privacy model:** everything runs on your machine (or your server). Your
files, database, and exports never leave it. The only outbound traffic is
calls to the LLM endpoint you configure (plus WorkOS if sign-in is enabled).

---

## First-time setup

1. Open **Settings** from the home page.
2. Paste your API key. Any OpenAI-compatible endpoint works — vanilla OpenAI,
   a corporate gateway, or a local proxy:
   - **API key**: e.g. `sk-...`
   - **Base URL**: leave as `https://api.openai.com/v1` unless yours differs
   - **Model**: defaults to `gpt-4o`; use whatever your endpoint serves
3. Click **Test connection** — it sends a tiny real request so a bad key fails
   here rather than mid-generation.
4. **Save**. The key is stored in the app's local database only.

The home page shows a yellow banner until a key is configured.

> Note for non-OpenAI endpoints: slide *generation* uses your configured
> model; document *search* additionally calls an embeddings model
> (`text-embedding-3-small` by default) against the same base URL, so your
> provider must support embeddings too.

---

## The workflow

### 1. Upload sources

**Sources → Upload file.** Supported: PDF, DOCX, XLSX, Markdown, plain text.
Documents are parsed into text chunks that get searched when slides are
written. Remove sources you no longer need — this deletes their file and
chunks.

### 2. Create a deck

**New Deck**, then:

- **Objective** — what the presentation should achieve. This drives
  everything, so be concrete: *"Convince the exec team to fund the Q3 migration;
  emphasize cost and risk reduction"* beats *"quarterly update"*.
- **Audience** — e.g. "executive team", "engineers", "customers".
- **Style direction** — free-form, e.g. "clean and professional".
- **Sources** — tick the files to ground the deck in. Slides cite the chunks
  they used.

Click **Create Deck** to open the editor.

### 3. Generate

In the editor click **Generate**. The app first writes an outline (title +
per-slide purpose and key message), then renders each slide one by one. Every
slide is machine-checked in headless Chromium (overflow, broken markup) and
automatically repaired when something's off. Generation takes a while — one
LLM round-trip per slide plus validation.

### 4. Refine

Select any slide in the left sidebar:

- **Revision chat** — describe the change in plain language ("make the title
  bigger", "cut this down to two bullets") and press Enter. The slide is
  regenerated with your instruction applied.
- **Regenerate** — rewrite the slide from scratch.
- **Direct edit** — tweak the raw HTML/CSS yourself in the bottom-left panes;
  changes save when you click outside the box.
- **Move up / Move down** — reorder.
- **Citations** — shows which source excerpts the slide drew from.

Every revision creates a stored version, so history accumulates per slide.

### 5. Present or export

- **Present** opens full-screen mode; advance with the keyboard.
- **Export PDF** downloads the whole deck as `deck-title.pdf`.

---

## Tips

- Iterate per slide instead of regenerating whole decks — it's faster and the
  rest of the deck stays untouched.
- Smaller, focused sources beat one giant dump; retrieval picks the most
  relevant excerpts either way, but noise dilutes quality.
- Charts are generated as inline SVG from structured data — ask for "show this
  as a bar chart" in revision chat.
- Deleting a deck removes its slides and versions; deleting a source does not
  affect already-generated decks (their text lives on inside them).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Yellow banner on home page | No API key saved yet — go to Settings |
| "Failed: 401 ..." on test connection | Key rejected by the endpoint; re-check key/base URL/model |
| Test passes but generation fails | Some endpoints lack JSON-schema support required for slide generation; try `gpt-4o` on OpenAI directly |
| Slide ignores your documents | Make sure the source was ticked when the deck was created, then hit Generate again |
| Blank or overflowing preview | Click Regenerate on that slide — validation/repair usually fixes it; worst case edit HTML directly |
| Export does nothing | Check the server logs; Chromium missing is the usual cause (see Deployment Guide) |
