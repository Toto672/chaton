/**
 * GET /api/health
 *
 * Returns the health status and catalog metadata.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadCatalog } from "../lib/storage.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const catalog = await loadCatalog();

  res.setHeader("Access-Control-Allow-Origin", "*");

  return res.status(200).json({
    status: catalog ? "ok" : "no_catalog",
    generatedAt: catalog?.generatedAt ?? null,
    totalCount: catalog?.totalCount ?? 0,
    breakdown: catalog
      ? {
          builtin: catalog.builtin.length,
          channel: catalog.channel.length,
          tool: catalog.tool.length,
        }
      : null,
  });
}
