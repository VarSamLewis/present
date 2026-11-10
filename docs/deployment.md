# Deployment Guide

Vibeslide is a self-contained web app: one Node.js process backed by SQLite and
the local filesystem, plus a headless Chromium used for slide validation and
PDF export. The only outbound calls are to your configured LLM endpoint (and
to WorkOS, if you enable the optional sign-in gate).

## Requirements

- Node.js 20+ (pinned in `.nvmrc`) **or** Docker
- ~2 GB disk (Node modules + Playwright's Chromium)
- An OpenAI-compatible API key (configured in-app, see the User Guide)

---

## Option A: Docker Compose (recommended for servers)

```bash
git clone <repo> && cd present
docker compose up -d --build
```

The app is now at `http://<host>:3000`. Everything persistent lives in
`./data` on the host (SQLite database, uploaded sources, exports), so rebuilds
and upgrades don't lose anything.

Configuration is passed through environment variables — create a `.env` file
next to `docker-compose.yml` (compose reads it automatically):

```bash
# Optional sign-in gate (see "Authentication" below)
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=
WORKOS_REDIRECT_URI=
```

## Option B: Railway

Railway builds the same `Dockerfile`, so Chromium and the Playwright base image
come along automatically. [`railway.toml`](../railway.toml) wires up the
Dockerfile build and the `/api/health` health check.

1. Create a project on [Railway](https://railway.com) and deploy this repo
   (connect the GitHub repo, or run `railway up` with the CLI).
2. **Add a volume mounted at `/app/data`.** The image writes SQLite, uploads,
   and exports there. Without a volume that data is lost on every deploy.
3. Generate a domain. The container listens on Railway's `$PORT`, so the
   detected target port is correct out of the box.
4. Optional: add the `WORKOS_*` variables to require sign-in.

Notes:

- Give the service **at least 2 GB RAM** — Chromium needs headroom for slide
  validation and PDF export.
- Keep it at **one replica**. A single SQLite file on one volume does not
  support horizontal scaling.
- Backups: snapshot the volume from the Railway dashboard, or exec into the
  service and run `sqlite3 data/vibeslide.db ".backup backup.db"`.
- Migrations run automatically on the first request after each deploy.

## Option C: Run directly on a machine

```bash
nvm use                 # Node 20 from .nvmrc
npm install
npx playwright install chromium    # add --with-deps on fresh Linux servers
npm run build
npm start               # http://localhost:3000
```

For development instead: `npm run dev`.

## Option D: Bare-metal server with systemd

After completing Option C's setup:

```ini
# /etc/systemd/system/vibeslide.service
[Unit]
Description=Vibeslide
After=network-online.target

[Service]
WorkingDirectory=/opt/present
ExecStart=/usr/bin/npm start
Restart=on-failure
EnvironmentFile=-/opt/present/.env.local
User=vibeslide

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vibeslide
```

---

## Exposing it to the network

The app listens on port 3000. For real deployments put a reverse proxy with
TLS in front of it.

### Caddy (automatic HTTPS)

```
slides.example.com {
    reverse_proxy localhost:3000
}
```

### nginx

```nginx
server {
    listen 443 ssl;
    server_name slides.example.com;
    # ssl_certificate / ssl_certificate_key ...

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # needed for HMR in dev only
        proxy_set_header Connection "upgrade";
    }
}
```

> If your proxy rewrites or terminates TLS in a way that changes the public
> origin, set `WORKOS_REDIRECT_URI=https://slides.example.com/api/auth/callback`
> so sign-in redirects stay correct.

---

## Authentication (optional but recommended for hosted installs)

By default the app has **no login** — anyone who can reach it can use your API
key. To require sign-in via [WorkOS AuthKit](https://workos.com):

1. Create a WorkOS account and an AuthKit application in the dashboard.
2. In the AuthKit dashboard, whitelist your callback URL(s):
   - `http://localhost:3000/api/auth/callback` (local)
   - `https://slides.example.com/api/auth/callback` (production)
3. Copy the **Client ID** and **Secret Key** from the dashboard.
4. Generate a cookie password: `openssl rand -base64 32`
5. Set the four variables (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
   `WORKOS_COOKIE_PASSWORD`, optionally `WORKOS_REDIRECT_URI`) in your env /
   `.env` and restart.

Until all three required variables are set the app runs wide open, so local
development needs no setup. Once enabled, every page requires sign-in and a
"Sign out" link appears on the home page.

AuthKit has a generous free tier that covers personal and small-team use.

---

## Environment variables

All are optional. Keys are normally managed in the app's Settings page.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_PATH` | `./data/vibeslide.db` | SQLite location |
| `DATA_DIRECTORY` | `./data` | Uploads, screenshots, exports |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model (uses the same key/endpoint as generation) |
| `MAX_SOURCE_CHUNKS_PER_SLIDE` | `8` | Retrieval depth per slide |
| `MAX_SLIDE_REPAIR_ATTEMPTS` | `2` | Render-failure repair loop |
| `SLIDE_GENERATION_CONCURRENCY` | `2` | Reserved (generation currently sequential) |
| `WORKOS_API_KEY` | unset | Enables the auth gate when set |
| `WORKOS_CLIENT_ID` | unset | Required for the auth gate |
| `WORKOS_COOKIE_PASSWORD` | unset | ≥32-char random string, seals session cookies |
| `WORKOS_REDIRECT_URI` | derived from request origin | Override behind rewriting proxies |

## Data layout & backups

Everything lives in one directory (`./data`, or `/app/data` in Docker):

```
data/
  vibeslide.db          # SQLite (with -wal/-shm siblings while running)
  uploads/<sourceId>/   # original uploaded files
  decks/<deckId>/       # screenshots and exported PDFs
```

Backup = copy this directory. For a consistent DB snapshot either stop the
app first or use `sqlite3 data/vibeslide.db ".backup backup.db"`.

## Upgrades

```bash
git pull
docker compose up -d --build     # or: npm install && npm run build, then restart
```

Schema migrations run automatically on first use after startup — no manual
steps.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EADDRINUSE :3000` | Another process owns the port; change the mapping (`3100:3000`) or stop the old process |
| PDF export fails / blank exports | Chromium missing: `npx playwright install chromium` (bare metal). The Docker image ships it |
| Native module errors after Node upgrade (`better-sqlite3`) | `npm rebuild better-sqlite3`, or reinstall with `npm ci` |
| Sign-in redirect loops | Callback URL not whitelisted in the AuthKit dashboard, or `WORKOS_REDIRECT_URI` doesn't match the public URL |
| Slides ignore uploaded documents | Re-create the deck selecting the intended sources before generating |
