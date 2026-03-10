/**
 * Storage abstraction. Uses Vercel Blob in production, falls back to
 * local filesystem for development.
 */

import { put, head } from "@vercel/blob";
import type { ExtensionCatalog } from "./types.js";

const CATALOG_KEY = "extensions/catalog.json";

function iconKey(packageId: string, ext: string): string {
  const safe = packageId.replace(/\//g, "-");
  return `extensions/icons/${safe}.${ext}`;
}

// -- Vercel Blob storage ------------------------------------------------------

export async function saveCatalog(catalog: ExtensionCatalog): Promise<string> {
  const blob = await put(CATALOG_KEY, JSON.stringify(catalog, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function loadCatalog(): Promise<ExtensionCatalog | null> {
  try {
    const blob = await head(CATALOG_KEY);
    if (!blob) return null;
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    return (await res.json()) as ExtensionCatalog;
  } catch {
    return null;
  }
}

export async function saveIcon(
  packageId: string,
  buffer: Buffer,
  contentType: string,
  ext: string
): Promise<string | null> {
  try {
    const key = iconKey(packageId, ext);
    const blob = await put(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (err) {
    console.warn(`  Failed to save icon for ${packageId}: ${(err as Error).message}`);
    return null;
  }
}
