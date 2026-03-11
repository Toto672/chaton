/**
 * GET /api/extensions
 *
 * Returns the full extension catalog. Supports optional query params:
 *   ?category=channel|tool|builtin  -- filter by category
 *   ?q=search+term                  -- search by name/description/keywords
 *
 * Response shape: ExtensionCatalog (or filtered subset).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadCatalog } from "../../lib/storage.js";
import { normalizeCatalogIconUrls } from "../../lib/icon-resolver.js";
import type { ExtensionEntry, ExtensionCatalog } from "../../lib/types.js";

const CACHE_MAX_AGE = 300; // 5 minutes
const STALE_WHILE_REVALIDATE = 3600; // 1 hour

function matchesSearch(ext: ExtensionEntry, query: string): boolean {
  const q = query.toLowerCase();
  return (
    ext.name.toLowerCase().includes(q) ||
    ext.description.toLowerCase().includes(q) ||
    ext.id.toLowerCase().includes(q) ||
    ext.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const catalog = await loadCatalog();
  if (!catalog) {
    return res.status(503).json({
      error: "Catalog not available. Run 'npm run sync' first.",
    });
  }

  const category = req.query.category as string | undefined;
  const query = req.query.q as string | undefined;

  let result: ExtensionCatalog;

  if (category || query) {
    let builtin = catalog.builtin;
    let channel = catalog.channel;
    let tool = catalog.tool;

    if (category) {
      builtin = category === "builtin" ? builtin : [];
      channel = category === "channel" ? channel : [];
      tool = category === "tool" ? tool : [];
    }

    if (query) {
      builtin = builtin.filter((e) => matchesSearch(e, query));
      channel = channel.filter((e) => matchesSearch(e, query));
      tool = tool.filter((e) => matchesSearch(e, query));
    }

    result = {
      generatedAt: catalog.generatedAt,
      totalCount: builtin.length + channel.length + tool.length,
      builtin,
      channel,
      tool,
    };
  } else {
    result = catalog;
  }

  // Normalize icon URLs to be absolute and accessible
  result = normalizeCatalogIconUrls(result);

  // Set CORS and caching headers
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json(result);
}
