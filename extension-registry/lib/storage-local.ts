/**
 * Local filesystem storage for development.
 * Mirrors the Vercel Blob API but writes to .data/ on disk.
 */

import fs from "node:fs";
import path from "node:path";
import type { ExtensionCatalog } from "./types.js";

const DATA_DIR = path.join(process.cwd(), ".data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");
const ICONS_DIR = path.join(DATA_DIR, "icons");

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

export async function saveCatalogLocal(catalog: ExtensionCatalog): Promise<string> {
  ensureDirs();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  console.log(`  Catalog saved to ${CATALOG_PATH}`);
  return CATALOG_PATH;
}

export async function loadCatalogLocal(): Promise<ExtensionCatalog | null> {
  try {
    if (!fs.existsSync(CATALOG_PATH)) return null;
    const raw = fs.readFileSync(CATALOG_PATH, "utf-8");
    return JSON.parse(raw) as ExtensionCatalog;
  } catch {
    return null;
  }
}

export async function saveIconLocal(
  packageId: string,
  buffer: Buffer,
  _contentType: string,
  ext: string
): Promise<string | null> {
  ensureDirs();
  const safe = packageId.replace(/\//g, "-");
  const filename = `${safe}.${ext}`;
  const filePath = path.join(ICONS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  // Return a URL path that the local API can serve
  return `/api/icons/${safe}.${ext}`;
}

/** Read a locally stored icon file */
export function readIconLocal(filename: string): { buffer: Buffer; contentType: string } | null {
  const filePath = path.join(ICONS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filename).slice(1).toLowerCase();
  const contentType =
    ext === "svg"
      ? "image/svg+xml"
      : ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "webp"
      ? "image/webp"
      : "application/octet-stream";

  return { buffer: fs.readFileSync(filePath), contentType };
}
