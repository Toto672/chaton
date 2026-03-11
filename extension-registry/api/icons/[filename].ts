/**
 * GET /api/icons/[filename]
 *
 * Serves extension icons stored in Vercel Blob storage.
 * In production, extension iconUrl fields point directly to Vercel Blob CDN URLs,
 * so this route is rarely used. It exists for local development where icons
 * are stored on the local filesystem.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readIconLocal } from "../../lib/storage-local.js";

const CACHE_MAX_AGE = 86400; // 24 hours for immutable icon files
const STALE_WHILE_REVALIDATE = 604800; // 7 days

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(200).end();
  }

  const { filename } = req.query;
  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Missing filename parameter" });
  }

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // Try to read from local storage (development only)
  const icon = readIconLocal(filename);
  if (!icon) {
    return res.status(404).json({
      error: "Icon not found. In production, icons are served directly from Vercel Blob CDN.",
    });
  }

  // Set CORS and caching headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", icon.contentType);
  res.setHeader(
    "Cache-Control",
    `public, immutable, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
  );

  return res.status(200).end(icon.buffer);
}
