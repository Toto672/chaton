/**
 * GET /api/extensions/[slug]
 *
 * Returns a single extension by its slug.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadCatalog } from "../../lib/storage.js";
import type { ExtensionEntry } from "../../lib/types.js";

const CACHE_MAX_AGE = 300;
const STALE_WHILE_REVALIDATE = 3600;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Missing slug parameter" });
  }

  const catalog = await loadCatalog();
  if (!catalog) {
    return res.status(503).json({
      error: "Catalog not available. Run 'npm run sync' first.",
    });
  }

  const allExtensions: ExtensionEntry[] = [
    ...catalog.builtin,
    ...catalog.channel,
    ...catalog.tool,
  ];

  const ext = allExtensions.find((e) => e.slug === slug);
  if (!ext) {
    return res.status(404).json({ error: `Extension "${slug}" not found` });
  }

  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  return res.status(200).json(ext);
}
