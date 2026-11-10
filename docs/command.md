# Commands

Every command in this project, with copy-pasteable snippets. Run them from the
repository root.

## Prerequisites

| Tool | Notes |
|---|---|
| [nvm](https://github.com/nvm-sh/nvm) | Node version is pinned in `.nvmrc` (22) |
| npm | Ships with Node |
| Docker | Optional, for the container workflow |
| OpenAI-compatible API key | Entered in the app's Settings page, not the shell |

```bash
nvm use            # or: nvm install && nvm use
node --version     # should be v22.x
```

## Install

```bash
npm ci                                   # clean install from package-lock.json
npx playwright install chromium          # browser used for slide validation + PDF export
```

`npx playwright install --with-deps chromium` on a fresh Linux server installs
the required system libraries too. The Docker image already includes both.

## Nix flake

`flake.nix` provides the same toolchain without touching your host system:
Node 22, npm, Python/make/gcc/pkg-config for `better-sqlite3`, the `sqlite3`
CLI, and Playwright's patched Chromium. This is the supported path on NixOS,
where the browser bundled by `npx playwright install` usually cannot start.

```bash
nix develop                # interactive dev shell
nix develop -c npm ci      # install deps against the shell's Node
nix develop -c npm run dev # one-off command
nix develop -c npm run build
nix fmt                    # format flake.nix (nixfmt-rfc-style)
nix flake check            # evaluate the flake
```

Inside the shell, `PLAYWRIGHT_BROWSERS_PATH` points at nixpkgs' browser bundle
and `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is set, so `npm ci` skips the browser
download and PDF export works out of the box.

> The flake pins nixpkgs to the revision whose `playwright-driver` matches
> `playwright` in `package-lock.json` (currently 1.61.1). Playwright refuses to
> drive a mismatched browser revision, so when you bump `playwright`, bump the
> flake pin too (`nix flake update`) and check `nix eval .#devShells.x86_64-linux.default`
> still evaluates.

Always run `npm ci` (or `npm rebuild better-sqlite3`) **inside** the shell after
switching Node versions — `better-sqlite3` is a native addon built for one Node
ABI at a time.

## Run

```bash
npm run dev        # development server with hot reload — http://localhost:3000
npm run build      # production build (also regenerates public/slide-tailwind.css)
npm start          # serve the production build     — http://localhost:3000
```

Custom port (Next passes the flag through):

```bash
npm run dev -- -p 3100
npm start -- -p 3100
```

Then open <http://localhost:3000>, go to **Settings**, and paste your API key.
No `.env.local` is required for the app to run.

`npm run dev` skips the sign-in gate for `localhost` requests even if Clerk keys
are configured. `npm start` always enforces it — see
[Authentication](#authentication-optional).

## Quality checks

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest, single run
npm run test:watch # Vitest in watch mode
npm run build      # catches type and route errors as part of the build
```

CI runs lint, typecheck, tests, build, and a Docker image build. Run the four
local commands above before pushing.

## Slide stylesheet

The generated slide CSS is a build artifact that is also committed:

```bash
npm run build:slide-css    # regenerate public/slide-tailwind.css
```

`npm run build` runs this for you.

## Docker

```bash
docker compose up -d --build     # build and start in the background
docker compose logs -f vibeslide # follow logs
docker compose down              # stop (data stays in ./data)
docker compose up -d --build     # apply code changes
```

Or without Compose:

```bash
docker build -t vibeslide .
docker run --rm -p 3000:3000 -v "$PWD/data:/app/data" vibeslide
```

`PORT` is honoured if the platform injects one:

```bash
docker run --rm -e PORT=8080 -p 8080:8080 -v "$PWD/data:/app/data" vibeslide
```

## Railway

Railway builds the same `Dockerfile` via `railway.toml`.

```bash
railway login
railway link          # select the project
railway up            # deploy the current directory
railway logs          # tail deploy/runtime logs
railway open          # open the service in the browser
```

The volume at `/app/data`, memory (≥ 2 GB), and replica count (1) are configured
in the Railway dashboard, not the CLI. See
[Deployment Guide → Railway](deployment.md#option-b-railway).

## Authentication (optional)

Auth is off unless both Clerk keys are set:

```bash
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
export CLERK_SECRET_KEY=sk_test_...
```

```bash
npm run dev                        # localhost is exempt while developing
npm run build && npm start        # enforces sign-in locally, like production
```

For Docker/Compose put the two variables in `.env` next to
`docker-compose.yml`; on Railway add them as service variables. No rebuild is
needed — they are read at runtime.

## Data and backups

Everything lives in `./data` (or `/app/data` in Docker):

```bash
sqlite3 data/vibeslide.db ".backup /tmp/vibeslide-backup.db"   # consistent DB snapshot
cp -a data /tmp/vibeslide-data-backup                          # full backup (stop the app first)
```

Destructive: reset the local database and uploaded files.

```bash
rm -rf data     # deletes decks, sources, uploads, exports, and the SQLite DB
```

Migrations run automatically on the first request after startup, so a fresh
`data/` directory is fine.

## Health and quick probes

```bash
curl -s localhost:3000/api/health          # {"ok":true,"configured":true|false}
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/
```

The health check hits the database, so it also runs migrations on a fresh
volume and stays public when auth is enabled.

## Troubleshooting

| Symptom | Command / fix |
|---|---|
| `EADDRINUSE :3000` | Use another port: `npm run dev -- -p 3100` |
| "No API key configured" | Open **Settings** and save a key; click **Test connection** |
| PDF export fails / blank exports | `npx playwright install chromium` (bare metal) |
| Chromium won't launch on NixOS | Use `nix develop` — the flake ships a patched Chromium and sets `PLAYWRIGHT_BROWSERS_PATH` |
| Native module errors after a Node upgrade | `npm rebuild better-sqlite3` or `npm ci` |
| Sign-in loop locally | Use `npm run dev` on localhost, or unset the Clerk keys |
| Stale Next.js build/types | `rm -rf .next && npm run build` |
| Docker build fails on `better-sqlite3` | Rebuild without cache: `docker compose build --no-cache` |

## Environment overrides

A `.env.local` is optional; copy the template to tune anything non-secret:

```bash
cp .env.example .env.local
```

Common options: `DATABASE_PATH`, `DATA_DIRECTORY`, `EMBEDDING_MODEL`,
`MAX_SOURCE_CHUNKS_PER_SLIDE`, `MAX_SLIDE_REPAIR_ATTEMPTS`, and the Clerk keys.
AI keys are normally stored in the app's Settings page instead.
