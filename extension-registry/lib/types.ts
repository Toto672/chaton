/**
 * Shared types for the Chatons extension registry.
 * Used by the sync job, the API routes, and external consumers.
 */

export type ExtensionCategory = "channel" | "tool" | "builtin";

export interface ExtensionEntry {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  category: ExtensionCategory;
  author: string;
  license: string;
  keywords: string[];
  capabilities: string[];
  repositoryUrl: string | null;
  npmUrl: string;
  iconUrl: string | null;
}

export interface ExtensionCatalog {
  generatedAt: string;
  totalCount: number;
  builtin: ExtensionEntry[];
  channel: ExtensionEntry[];
  tool: ExtensionEntry[];
}

/** Shape of data/registry.json */
export interface RegistrySource {
  description?: string;
  builtin: BuiltinEntry[];
  npm: string[];
}

export interface BuiltinEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  keywords: string[];
  repositoryUrl?: string;
  npmUrl?: string;
  iconUrl?: string;
}
