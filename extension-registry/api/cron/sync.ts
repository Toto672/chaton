/**
 * Vercel Cron handler: runs on a schedule to sync extension data from npm.
 * Triggered daily by Vercel Cron (configured in vercel.json).
 *
 * GET /api/cron/sync
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { syncExtensions } from "../../lib/sync.js";
import { loadRegistrySource } from "../../lib/registry-source.js";
import { saveCatalog, saveIcon } from "../../lib/storage.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify authorization. CRON_SECRET must always be set.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "CRON_SECRET not configured" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const registry = loadRegistrySource();

    const catalog = await syncExtensions({
      registry,
      saveIcon,
    });

    const url = await saveCatalog(catalog);

    return res.status(200).json({
      ok: true,
      totalCount: catalog.totalCount,
      generatedAt: catalog.generatedAt,
      catalogUrl: url,
    });
  } catch (err) {
    console.error("Sync failed:", err);
    return res.status(500).json({
      error: "Sync failed",
      message: (err as Error).message,
    });
  }
}
