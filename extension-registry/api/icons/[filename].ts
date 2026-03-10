/**
 * GET /api/icons/[filename]
 *
 * In production, extension iconUrl fields point directly to Vercel Blob CDN
 * URLs, so this route is not used. It exists only for local development.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return res.status(404).json({
    error: "Icons are served directly from Blob CDN. Use the iconUrl field from /api/extensions.",
  });
}
