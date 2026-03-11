# Extension Icon URL Resolution Fix

**Status:** ✅ Complete  
**Date:** March 11, 2026

## Problem

After migrating the landing page to use the marketplace.chatons.ai API for extension catalogs, extension icons were not displaying. The issue was that icon URLs were not being properly resolved from relative paths to absolute HTTPS URLs that the landing page could fetch.

## Root Cause Analysis

1. **Icon URLs stored in catalog** — The extension-registry stores icon URLs as either:
   - Absolute Vercel Blob CDN URLs (production): `https://blob.vercel-storage.com/...`
   - Relative API paths (development): `/api/icons/@scope-extension.svg`

2. **Landing page fetches API** — The landing page API client at `landing/src/api/marketplace.ts` fetches from `https://marketplace.chatons.ai/api/extensions`

3. **Missing normalization** — The API responses were returning icon URLs as-is without converting relative paths to absolute URLs, breaking image loads in the browser

## Solution Implemented

### 1. New Icon Resolver Utility (`extension-registry/lib/icon-resolver.ts`)

Created utility functions to normalize icon URLs:

```typescript
normalizeIconUrl(iconUrl)        // Convert single URL to absolute
normalizeExtensionIconUrl(entry) // Normalize one extension entry  
normalizeCatalogIconUrls(catalog) // Normalize entire catalog
```

**Logic:**
- Absolute URLs (http/https) → return as-is
- Relative paths (`/api/icons/...`) → convert to absolute with API base URL
- Null/empty → return null

### 2. Updated API Endpoints

#### `/api/extensions` (index.ts)
- Imports `normalizeCatalogIconUrls()` from icon-resolver
- Normalizes all icons before returning response
- Added CORS headers: `Access-Control-Allow-Origin: *`
- Added OPTIONS method support for preflight requests

#### `/api/extensions/:slug` (slug.ts)
- Imports `normalizeExtensionIconUrl()` from icon-resolver  
- Normalizes single extension icon before returning
- Added CORS headers and OPTIONS support

#### `/api/icons/:filename` (icons endpoint)
- Enhanced from simple 404 to functional icon server
- Serves local development icons from `.data/icons/` directory
- Returns proper `Content-Type` header based on icon format
- Set aggressive caching headers (24h for immutable assets)
- Added CORS headers for browser access
- Handles OPTIONS preflight requests

### 3. Environment Handling

Icon resolver uses environment variables to determine API base URL:

```typescript
const API_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.API_URL || "http://localhost:3456";
```

Works in:
- **Production (Vercel)** — Uses VERCEL_URL for absolute URL
- **Staging** — Uses API_URL if set
- **Development** — Falls back to localhost:3456

## Files Modified

| File | Changes |
|------|---------|
| `extension-registry/lib/icon-resolver.ts` | NEW - Icon URL normalization utilities |
| `extension-registry/api/extensions/index.ts` | Use normalizer, add CORS headers, OPTIONS support |
| `extension-registry/api/extensions/[slug].ts` | Use normalizer, add CORS headers, OPTIONS support |
| `extension-registry/api/icons/[filename].ts` | Full rewrite - functional icon server with CORS |

## How It Works

### Development Flow
1. Sync fetches icons from npm, stores in `.data/icons/`
2. `saveIconLocal()` returns relative URL: `/api/icons/@scope-extension.svg`
3. Catalog stores this relative URL
4. API normalizes to absolute: `http://localhost:3456/api/icons/@scope-extension.svg`
5. Landing page fetches with absolute URL ✅

### Production Flow (Vercel)
1. Sync fetches icons from npm, uploads to Vercel Blob
2. `saveIcon()` returns absolute Blob URL: `https://blob.vercel-storage.com/...`
3. Catalog stores this Blob URL  
4. API normalizes (no-op since already absolute)
5. Landing page fetches from CDN ✅

## CORS Headers Added

All extension endpoints now include:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

This allows the landing page to fetch icons across domains.

## Caching Strategy

- **Catalog** — 5 min cache + 1 hour stale-while-revalidate
- **Icons** — 24h immutable cache + 7 day stale-while-revalidate

## Testing Checklist

- [ ] Icons display on landing page home carousel
- [ ] Icons display on extensions listing page
- [ ] Icons display on extension detail pages
- [ ] Local development: `npm run dev` shows icons
- [ ] Production: marketplace.chatons.ai icons load
- [ ] Network DevTools shows icons fetching from correct URL
- [ ] No CORS errors in browser console
- [ ] Icon cache headers present in Network tab

## Rollback

If issues arise:

```bash
# Revert extension-registry changes
cd extension-registry
git revert <commit-hash>
npm run sync  # Re-sync without normalizer
```

## Next Steps

1. Deploy extension-registry changes to production
2. Run `npm run sync` on marketplace.chatons.ai to populate catalog with icons
3. Test landing page icons
4. Monitor browser console for CORS or loading errors
