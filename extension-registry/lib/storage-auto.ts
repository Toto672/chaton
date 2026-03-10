/**
 * Storage factory: returns the appropriate storage functions based on
 * the environment. Uses Vercel Blob in production, local filesystem in dev.
 */

import type { ExtensionCatalog } from "./types.js";

const isVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function loadCatalogAuto(): Promise<ExtensionCatalog | null> {
  if (isVercelBlob) {
    const { loadCatalog } = await import("./storage.js");
    return loadCatalog();
  }
  const { loadCatalogLocal } = await import("./storage-local.js");
  return loadCatalogLocal();
}

export async function saveCatalogAuto(catalog: ExtensionCatalog): Promise<string> {
  if (isVercelBlob) {
    const { saveCatalog } = await import("./storage.js");
    return saveCatalog(catalog);
  }
  const { saveCatalogLocal } = await import("./storage-local.js");
  return saveCatalogLocal(catalog);
}

export async function saveIconAuto(
  packageId: string,
  buffer: Buffer,
  contentType: string,
  ext: string
): Promise<string | null> {
  if (isVercelBlob) {
    const { saveIcon } = await import("./storage.js");
    return saveIcon(packageId, buffer, contentType, ext);
  }
  const { saveIconLocal } = await import("./storage-local.js");
  return saveIconLocal(packageId, buffer, contentType, ext);
}
