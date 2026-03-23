export type MemoryKind =
  | "preference"
  | "decision"
  | "fact"
  | "profile"
  | "repo_convention"
  | "task_state"
  | "summary";

export type MemoryStatus = "active" | "superseded";
export type MemoryVisibility = "private" | "shared";

export type MemoryCoreRecord = {
  id?: string;
  scope?: "global" | "project";
  organizationId?: string | null;
  userId?: string | null;
  projectId?: string | null;
  kind?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  topicKey?: string | null;
  confidence?: number | null;
  importance?: number | null;
  stabilityHours?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  reinforcedAt?: string | null;
  lastUsedAt?: string | null;
  timesUsed?: number | null;
  status?: MemoryStatus | null;
  visibility?: MemoryVisibility | null;
  score?: number | null;
  ftsRank?: number | null;
};

export type MemorySearchResult<T = MemoryCoreRecord> = T & {
  score: number;
  matchReasons: string[];
};

export type MemoryStats = {
  total: number;
  active: number;
  superseded: number;
  byKind: Record<string, number>;
  byScope: Record<string, number>;
  schemaVersion: number;
};

export type CapturedMemoryEntry = {
  kind: MemoryKind;
  title: string;
  content: string;
  topicKey: string;
  tags: string[];
  confidence: number;
  visibility: MemoryVisibility;
  summaryFallback: boolean;
};

export declare const MEMORY_SCHEMA_VERSION: number;
export declare const MEMORY_CAPTURE_CONFIDENCE_THRESHOLD: number;
export declare const MEMORY_KINDS: MemoryKind[];
export declare const MEMORY_STATUS: {
  ACTIVE: MemoryStatus;
  SUPERSEDED: MemoryStatus;
};
export declare const MEMORY_VISIBILITY: {
  PRIVATE: MemoryVisibility;
  SHARED: MemoryVisibility;
};

export declare function normalizeMemoryKind(kind: unknown): MemoryKind;
export declare function normalizeMemoryText(value: unknown): string;
export declare function buildTopicKey(input: {
  topicKey?: string | null;
  kind?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
}): string;
export declare function buildMemoryFingerprint(input: {
  scope?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  projectId?: string | null;
  kind?: string | null;
  topicKey?: string | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
}): string;
export declare function shouldSupersedeKind(kind: unknown): boolean;
export declare function buildMemorySearchText(input: {
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  topicKey?: string | null;
  kind?: string | null;
}): string;
export declare function computeFreshnessFactor(input: MemoryCoreRecord): number;
export declare function rerankMemoryCandidates<T extends MemoryCoreRecord>(params: {
  query: string;
  candidates: T[];
  limit?: number;
}): Array<MemorySearchResult<T>>;
export declare function buildMemoryCapturePrompt(params: {
  conversationText: string;
}): string;
export declare function parseMemoryCaptureResponse(text: string): CapturedMemoryEntry[];
export declare function shouldPersistCapturedEntry(entry: CapturedMemoryEntry): boolean;
export declare function summarizeMemoryStats(entries: MemoryCoreRecord[]): MemoryStats;
