/**
 * Local sync runner: fetches extension data from npm and stores it
 * on the local filesystem. Used for development and testing.
 *
 * Usage: npx tsx lib/sync-runner.ts
 */

import { syncExtensions } from "./sync.js";
import { loadRegistrySource } from "./registry-source.js";
import { saveCatalogLocal, saveIconLocal } from "./storage-local.js";

const registry = loadRegistrySource();

async function main() {
  const catalog = await syncExtensions({
    registry,
    saveIcon: saveIconLocal,
  });

  await saveCatalogLocal(catalog);

  console.log("\nLocal sync complete. Data written to .data/");
  console.log("Run 'npm run dev' to start the API server.");
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
