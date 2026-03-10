# Chatons Extension Registry

Centralized extension registry that syncs metadata and icons from npm and serves a public API. Both the Chatons desktop app and the landing page consume this API to display extension information.

## Architecture

```
extension-registry/
  api/
    health.ts                 GET /api/health
    cron/sync.ts              GET /api/cron/sync     (Vercel Cron, hourly)
    extensions/index.ts       GET /api/extensions
    extensions/[slug].ts      GET /api/extensions/:slug
    icons/[filename].ts       GET /api/icons/:filename
  data/
    registry.json             Source of truth: which extensions to track
  lib/
    types.ts                  Shared TypeScript types
    sync.ts                   Core sync logic (fetch npm, extract icons)
    storage.ts                Vercel Blob storage (production)
    storage-local.ts          Local filesystem storage (development)
    storage-auto.ts           Auto-detects environment and picks storage
    sync-runner.ts            CLI runner for local sync
    dev-server.ts             Local dev server
  vercel.json                 Vercel config with cron schedule
```

### How it works

1. **`data/registry.json`** lists all extensions to track (builtin definitions + npm package names)
2. **Vercel Cron** triggers `/api/cron/sync` every hour
3. The sync job fetches metadata from the npm registry for each package, extracts icons from tarballs, and stores everything in **Vercel Blob**
4. The API routes serve the cached catalog from Blob storage with CDN caching headers

### Storage

- **Production**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) -- globally distributed, no database needed
- **Development**: Local filesystem (`.data/` directory)
- Auto-detection via `BLOB_READ_WRITE_TOKEN` env var

## API

### `GET /api/health`

Returns registry status and catalog metadata.

```json
{
  "status": "ok",
  "generatedAt": "2026-03-10T12:28:34.416Z",
  "totalCount": 25,
  "breakdown": { "builtin": 3, "channel": 20, "tool": 2 }
}
```

### `GET /api/extensions`

Returns the full extension catalog. Supports query params:

| Param      | Description                          | Example                |
|------------|--------------------------------------|------------------------|
| `category` | Filter by `builtin`, `channel`, `tool` | `?category=channel`  |
| `q`        | Search name, description, keywords   | `?q=telegram`          |

Response shape:

```json
{
  "generatedAt": "2026-03-10T12:28:34.416Z",
  "totalCount": 25,
  "builtin": [...],
  "channel": [...],
  "tool": [...]
}
```

Each extension entry:

```json
{
  "id": "@thibautrey/chatons-channel-telegram",
  "slug": "telegram",
  "name": "Telegram",
  "version": "2.2.0",
  "description": "...",
  "category": "channel",
  "author": "Thibaut Rey",
  "license": "MIT",
  "keywords": ["extension", "channel", "telegram"],
  "capabilities": ["ui.mainView", "queue.publish", ...],
  "repositoryUrl": "https://github.com/...",
  "npmUrl": "https://www.npmjs.com/package/...",
  "iconUrl": "/api/icons/@thibautrey-chatons-channel-telegram.svg"
}
```

### `GET /api/extensions/:slug`

Returns a single extension by slug (e.g., `telegram`, `linear`, `automation`).

### `GET /api/icons/:filename`

Serves extension icon files (SVG, PNG). In production, `iconUrl` points directly to Vercel Blob CDN URLs instead.

## Development

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
cd extension-registry
npm install
```

### Sync extensions locally

Fetches all extension data from npm and stores it in `.data/`:

```bash
npm run sync
```

### Start the dev server

```bash
npm run dev
```

The server starts on `http://localhost:3456` with all API routes available.

### Adding a new extension

Edit `data/registry.json`:

- For **npm extensions**: add the package name to the `npm` array
- For **builtin extensions**: add an entry to the `builtin` array with inline metadata

Then run `npm run sync` to fetch the new data.

## Deployment (Vercel)

### Environment variables

| Variable               | Required | Description                              |
|------------------------|----------|------------------------------------------|
| `BLOB_READ_WRITE_TOKEN`| Yes      | Vercel Blob storage token                |
| `CRON_SECRET`          | Yes      | Secret for authenticating cron requests  |

### Deploy

```bash
vercel deploy --prod
```

The cron job runs automatically every hour. To trigger a manual sync:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.vercel.app/api/cron/sync
```

## Consuming the API

### From the landing page

```typescript
const res = await fetch("https://extensions.chatons.ai/api/extensions");
const catalog = await res.json();
```

### From the Chatons app

```typescript
const res = await fetch("https://extensions.chatons.ai/api/extensions");
const catalog = await res.json();
// Use catalog.channel, catalog.tool, catalog.builtin
```

### Search

```typescript
const res = await fetch("https://extensions.chatons.ai/api/extensions?q=telegram");
const results = await res.json();
```
