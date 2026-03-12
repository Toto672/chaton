/**
 * Shared registry source loader.
 *
 * In local development we resolve from the project root via process.cwd().
 * In serverless environments (for example Vercel), process.cwd() may not point
 * at the extension-registry package root, so we also resolve relative to this
 * file's location.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RegistrySource } from "./types.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, "..");

function candidatePaths(): string[] {
  return [
    path.join(process.cwd(), "data", "registry.json"),
    path.join(packageRoot, "data", "registry.json"),
  ];
}

export function loadRegistrySource(): RegistrySource {
  let lastError: Error | null = null;

  for (const registryPath of candidatePaths()) {
    try {
      return JSON.parse(readFileSync(registryPath, "utf-8")) as RegistrySource;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(
    `Unable to load data/registry.json from any known location. Last error: ${lastError?.message ?? "unknown error"}`
  );
}
