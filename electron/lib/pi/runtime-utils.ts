import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ImageContent as PiAiImageContent } from "@mariozechner/pi-ai";
import { SettingsManager } from "@mariozechner/pi-coding-agent";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ScopedFileScope = {
  mode: "all" | "allowlist";
  paths?: string[];
};

export function cleanupStaleLocks(agentDir: string): void {
  const settingsPath = path.join(agentDir, "settings.json");
  const lockPath = `${settingsPath}.lock`;

  try {
    if (fs.existsSync(lockPath)) {
      const stats = fs.statSync(lockPath);
      const lockAge = Date.now() - stats.mtime.getTime();
      const staleThreshold = 5 * 60 * 1000;

      if (lockAge > staleThreshold) {
        console.log(`Cleaning up stale lock file: ${lockPath}`);
        fs.rmSync(lockPath, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.warn(
      `Failed to cleanup stale locks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function createSettingsManagerWithRetry(
  cwd: string,
  agentDir: string,
  maxRetries = 3,
): Promise<SettingsManager> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      cleanupStaleLocks(agentDir);
      return SettingsManager.create(cwd, agentDir);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = 100 * Math.pow(2, attempt - 1);
        console.warn(
          `Attempt ${attempt} failed to create SettingsManager, retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export function getOpenModeToolsCwd(): string {
  return process.platform === "win32" ? path.parse(process.cwd()).root : "/";
}

export function toPiImageContent(image: {
  data: string;
  mimeType: string;
}): PiAiImageContent {
  return {
    type: "image",
    data: image.data,
    mimeType: image.mimeType,
  };
}

export function safeJson(value: unknown): JsonValue {
  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return null;
  }
}

export function maskValue(value: string, start = 4, end = 2): string {
  const trimmed = value.trim();
  if (trimmed.length <= start + end) {
    return "*".repeat(Math.max(1, trimmed.length));
  }
  return `${trimmed.slice(0, start)}...${trimmed.slice(-end)}`;
}

export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

export function extractNestedErrorMessage(
  value: unknown,
  seen = new Set<unknown>(),
): string | null {
  if (!value || seen.has(value)) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value !== "object") return null;

  seen.add(value);
  const record = value as Record<string, unknown>;
  const directMessage =
    typeof record.message === "string" ? record.message.trim() : "";
  if (directMessage) return directMessage;

  const nestedCandidates = [record.cause, record.error, record.err, record.reason];
  for (const candidate of nestedCandidates) {
    const nestedMessage = extractNestedErrorMessage(candidate, seen);
    if (nestedMessage) return nestedMessage;
  }
  return null;
}

export function isPathWithinAllowedScope(
  absolutePath: string,
  workingDirectory: string,
  fileScope?: ScopedFileScope,
): boolean {
  if (!fileScope || fileScope.mode === "all") return true;
  const allowlist = Array.isArray(fileScope.paths) ? fileScope.paths : [];
  if (allowlist.length === 0) return false;
  const normalizedTarget = path.resolve(absolutePath);
  return allowlist.some((allowed) => {
    const allowedAbsolute = path.resolve(workingDirectory, allowed);
    const relative = path.relative(allowedAbsolute, normalizedTarget);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  });
}

export function isWriteLikeBashCommand(command: string): boolean {
  const lowered = command.toLowerCase();
  return [
    "rm ",
    "mv ",
    "cp ",
    "touch ",
    "mkdir ",
    "rmdir ",
    ">",
    "chmod ",
    "chown ",
    "sed -i",
    "perl -pi",
  ].some((token) => lowered.includes(token));
}

export function extractTextFromSnapshot(
  snapshot: { messages?: unknown[] } | null | undefined,
): string | null {
  const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i] as Record<string, unknown> | null;
    if (!msg) continue;
    const role =
      (typeof msg.role === "string" ? msg.role : null) ??
      ((msg.message as Record<string, unknown> | undefined)?.role as
        | string
        | undefined) ??
      "";
    if (role !== "assistant") continue;
    const rawContent = Array.isArray(msg.content)
      ? msg.content
      : Array.isArray(
            (msg.message as Record<string, unknown> | undefined)?.content,
          )
        ? ((msg.message as Record<string, unknown>).content as unknown[])
        : [];
    const parts = rawContent
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const p = part as Record<string, unknown>;
        return p.type === "text" && typeof p.text === "string" ? p.text : "";
      })
      .filter((text) => text.trim().length > 0);
    if (parts.length > 0) return parts.join("\n\n").trim();
  }
  return null;
}

export function buildSubagentResultFromSnapshot(
  snapshot: { messages?: unknown[] } | null | undefined,
): { summary?: string; outputText?: string } {
  const outputText = extractTextFromSnapshot(snapshot) ?? undefined;
  return {
    ...(outputText ? { outputText, summary: outputText.slice(0, 400) } : {}),
  };
}
