/**
 * Lightweight local dev server. Reads catalog from .data/ on disk
 * and serves the same API shape as the Vercel serverless functions.
 *
 * Usage: npx tsx lib/dev-server.ts [--port 3456]
 */

import http from "node:http";
import { syncExtensions } from "./sync.js";
import { loadRegistrySource } from "./registry-source.js";
import { saveCatalogLocal, saveIconLocal, readIconLocal, loadCatalogLocal } from "./storage-local.js";
import type { ExtensionEntry, ExtensionCatalog } from "./types.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const PORT = parseInt(
  process.argv.includes("--port")
    ? process.argv[process.argv.indexOf("--port") + 1]!
    : "3456",
  10
);

const registry = loadRegistrySource();

function matchesSearch(ext: ExtensionEntry, query: string): boolean {
  const q = query.toLowerCase();
  return (
    ext.name.toLowerCase().includes(q) ||
    ext.description.toLowerCase().includes(q) ||
    ext.id.toLowerCase().includes(q) ||
    ext.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

// -- Route handlers -----------------------------------------------------------

async function handleHealth(res: http.ServerResponse) {
  const catalog = await loadCatalogLocal();
  sendJson(res, 200, {
    status: catalog ? "ok" : "no_catalog",
    generatedAt: catalog?.generatedAt ?? null,
    totalCount: catalog?.totalCount ?? 0,
    breakdown: catalog
      ? { builtin: catalog.builtin.length, channel: catalog.channel.length, tool: catalog.tool.length }
      : null,
  });
}

async function handleExtensions(res: http.ServerResponse, query: Record<string, string>) {
  const catalog = await loadCatalogLocal();
  if (!catalog) return sendJson(res, 503, { error: "Catalog not available. Run 'npm run sync' first." });

  const category = query.category;
  const q = query.q;

  let builtin = catalog.builtin;
  let channel = catalog.channel;
  let tool = catalog.tool;

  if (category) {
    builtin = category === "builtin" ? builtin : [];
    channel = category === "channel" ? channel : [];
    tool = category === "tool" ? tool : [];
  }
  if (q) {
    builtin = builtin.filter((e) => matchesSearch(e, q));
    channel = channel.filter((e) => matchesSearch(e, q));
    tool = tool.filter((e) => matchesSearch(e, q));
  }

  sendJson(res, 200, {
    generatedAt: catalog.generatedAt,
    totalCount: builtin.length + channel.length + tool.length,
    builtin, channel, tool,
  });
}

async function handleExtensionBySlug(res: http.ServerResponse, slug: string) {
  const catalog = await loadCatalogLocal();
  if (!catalog) return sendJson(res, 503, { error: "Catalog not available." });

  const all: ExtensionEntry[] = [...catalog.builtin, ...catalog.channel, ...catalog.tool];
  const ext = all.find((e) => e.slug === slug);
  if (!ext) return sendJson(res, 404, { error: `Extension "${slug}" not found` });
  sendJson(res, 200, ext);
}

async function handleIcon(res: http.ServerResponse, filename: string) {
  if (/[/\\]/.test(filename) || filename.includes("..")) {
    return sendJson(res, 400, { error: "Invalid filename" });
  }
  const icon = readIconLocal(filename);
  if (!icon) return sendJson(res, 404, { error: "Icon not found" });

  res.writeHead(200, { "Content-Type": icon.contentType, "Cache-Control": "public, max-age=86400" });
  res.end(icon.buffer);
}

async function handleSync(res: http.ServerResponse) {
  try {
    const catalog = await syncExtensions({ registry, saveIcon: saveIconLocal });
    await saveCatalogLocal(catalog);
    sendJson(res, 200, { ok: true, totalCount: catalog.totalCount, generatedAt: catalog.generatedAt });
  } catch (err) {
    sendJson(res, 500, { error: "Sync failed", message: (err as Error).message });
  }
}

// -- Helpers ------------------------------------------------------------------

function sendJson(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

// -- Server -------------------------------------------------------------------

const routes: Array<{ pattern: RegExp; handle: (res: http.ServerResponse, query: Record<string, string>, match: RegExpMatchArray) => Promise<void> }> = [
  { pattern: /^\/api\/health$/, handle: (res) => handleHealth(res) },
  { pattern: /^\/api\/cron\/sync$/, handle: (res) => handleSync(res) },
  { pattern: /^\/api\/extensions$/, handle: (res, q) => handleExtensions(res, q) },
  { pattern: /^\/api\/extensions\/([^/]+)$/, handle: (res, _q, m) => handleExtensionBySlug(res, decodeURIComponent(m[1])) },
  { pattern: /^\/api\/icons\/([^/]+)$/, handle: (res, _q, m) => handleIcon(res, decodeURIComponent(m[1])) },
];

const server = http.createServer(async (httpReq, httpRes) => {
  const urlObj = new URL(httpReq.url!, `http://localhost:${PORT}`);
  const query: Record<string, string> = {};
  for (const [k, v] of urlObj.searchParams) query[k] = v;

  for (const route of routes) {
    const match = urlObj.pathname.match(route.pattern);
    if (match) {
      try {
        await route.handle(httpRes, query, match);
      } catch (err) {
        console.error(`Error in ${urlObj.pathname}:`, err);
        if (!httpRes.headersSent) sendJson(httpRes, 500, { error: (err as Error).message });
      }
      return;
    }
  }

  sendJson(httpRes, 404, { error: "Not found", path: urlObj.pathname });
});

server.listen(PORT, () => {
  console.log(`\n  Chatons Extension Registry - Dev Server`);
  console.log(`  ========================================`);
  console.log(`  http://localhost:${PORT}/api/health`);
  console.log(`  http://localhost:${PORT}/api/extensions`);
  console.log(`  http://localhost:${PORT}/api/extensions/{slug}`);
  console.log(`  http://localhost:${PORT}/api/icons/{filename}`);
  console.log(`  http://localhost:${PORT}/api/cron/sync  (trigger manual sync)`);
  console.log();
});
