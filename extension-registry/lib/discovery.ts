import type { RegistrySource } from "./types.js";

const FETCH_TIMEOUT_MS = 15_000;
const NPM_SEARCH_PAGE_SIZE = 250;
const MAX_SEARCH_PAGES = 8;

function normalizePackageName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name) return null;
  return name;
}

function isChatonsExtensionPackage(name: string): boolean {
  return /^@[^/]+\/chatons-(channel|extension)-[a-z0-9][a-z0-9-]*$/i.test(name);
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function packageHasChatonsManifest(packageName: string): Promise<boolean> {
  try {
    const registryData = await fetchJson(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );
    const latest = registryData["dist-tags"]?.latest;
    if (!latest) return false;

    const versionData = registryData.versions?.[latest];
    if (!versionData) return false;

    if (versionData.chatonExtension) return true;

    const tarballUrl = versionData.dist?.tarball;
    if (typeof tarballUrl !== "string" || !/^https:\/\/registry\.npmjs\.org\//i.test(tarballUrl)) {
      return false;
    }

    const res = await fetch(tarballUrl, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return false;

    const arrayBuf = await res.arrayBuffer();
    const tarballBuf = Buffer.from(arrayBuf);
    const decompressed = await import("node:zlib");
    const tarBuf = decompressed.gunzipSync(tarballBuf);

    let offset = 0;
    while (offset < tarBuf.length - 512) {
      const header = tarBuf.subarray(offset, offset + 512);
      if (header.every((b) => b === 0)) break;

      const nameEnd = header.indexOf(0, 0);
      const name = header
        .subarray(0, nameEnd > 0 && nameEnd < 100 ? nameEnd : 100)
        .toString("utf-8")
        .trim();
      const sizeStr = header.subarray(124, 136).toString("utf-8").trim();
      const size = parseInt(sizeStr, 8) || 0;
      const typeFlag = header[156];
      const isFile = typeFlag === 0 || typeFlag === 48;
      offset += 512;

      if (isFile && name === "package/chaton.extension.json" && size > 0 && size < 1024 * 1024) {
        const manifestBuf = Buffer.from(tarBuf.subarray(offset, offset + size));
        try {
          const manifest = JSON.parse(manifestBuf.toString("utf-8"));
          return typeof manifest?.id === "string";
        } catch {
          return false;
        }
      }

      offset += Math.ceil(size / 512) * 512;
    }

    return false;
  } catch (error) {
    console.warn(
      `  WARN: discovery metadata fetch failed for ${packageName}: ${(error as Error).message}`
    );
    return false;
  }
}

export async function discoverNpmPackages(
  registry: RegistrySource
): Promise<string[]> {
  const known = new Set(
    [...(registry.npm || []), ...(registry.autoDiscoveredNpm || [])].map((entry) => entry.trim())
  );
  const discovered = new Set<string>();

  for (let from = 0; from < MAX_SEARCH_PAGES * NPM_SEARCH_PAGE_SIZE; from += NPM_SEARCH_PAGE_SIZE) {
    const url = `https://registry.npmjs.org/-/v1/search?text=chatons&size=${NPM_SEARCH_PAGE_SIZE}&from=${from}`;
    let data: any;

    try {
      data = await fetchJson(url);
    } catch (error) {
      console.warn(
        `  WARN: discovery search failed at offset ${from}: ${(error as Error).message}`
      );
      break;
    }

    const objects = Array.isArray(data?.objects) ? data.objects : [];
    if (!objects.length) break;

    for (const item of objects) {
      const name = normalizePackageName(item?.package?.name);
      if (!name || known.has(name) || !isChatonsExtensionPackage(name)) continue;
      discovered.add(name);
    }

    const total = typeof data?.total === "number" ? data.total : 0;
    if (from + objects.length >= Math.min(total, MAX_SEARCH_PAGES * NPM_SEARCH_PAGE_SIZE)) {
      break;
    }
  }

  const candidates = [...discovered].sort((a, b) => a.localeCompare(b));
  const verified: string[] = [];

  for (const packageName of candidates) {
    if (await packageHasChatonsManifest(packageName)) {
      verified.push(packageName);
    }
  }

  return verified;
}

export async function withAutoDiscoveredRegistry(
  registry: RegistrySource
): Promise<RegistrySource> {
  const discovered = await discoverNpmPackages(registry);
  if (!discovered.length) return registry;

  return {
    ...registry,
    autoDiscoveredNpm: [
      ...(registry.autoDiscoveredNpm || []),
      ...discovered,
    ].sort((a, b) => a.localeCompare(b)),
    npm: [...registry.npm].sort((a, b) => a.localeCompare(b)),
  };
}
