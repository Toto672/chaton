import type { ComposerContextUsageData } from "@/extensions/composer-button-sdk";

type UsageRecord = {
  input?: number | null;
  output?: number | null;
  totalTokens?: number | null;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readUsageCandidate(source: unknown): UsageRecord | null {
  if (!isPlainRecord(source)) {
    return null;
  }
  const usage = isPlainRecord(source.usage) ? source.usage : null;
  if (!usage) {
    return null;
  }

  return {
    input:
      typeof usage.input === "number" && Number.isFinite(usage.input)
        ? Math.max(0, usage.input)
        : null,
    output:
      typeof usage.output === "number" && Number.isFinite(usage.output)
        ? Math.max(0, usage.output)
        : null,
    totalTokens:
      typeof usage.totalTokens === "number" && Number.isFinite(usage.totalTokens)
        ? Math.max(0, usage.totalTokens)
        : null,
  };
}

function readUsage(message: unknown): UsageRecord | null {
  if (!isPlainRecord(message)) {
    return null;
  }
  return readUsageCandidate(message) ?? readUsageCandidate(message.message);
}

function getMessageRole(message: unknown): string | null {
  if (!isPlainRecord(message)) {
    return null;
  }
  if (typeof message.role === "string") {
    return message.role;
  }
  if (isPlainRecord(message.message) && typeof message.message.role === "string") {
    return message.message.role;
  }
  return null;
}

function extractTextParts(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextParts(item));
  }
  if (!isPlainRecord(value)) {
    return [];
  }

  if (typeof value.text === "string") {
    return value.text.trim() ? [value.text] : [];
  }

  const content = value.content;
  if (Array.isArray(content)) {
    return content.flatMap((part) => extractTextParts(part));
  }

  const nestedMessage = value.message;
  if (nestedMessage) {
    return extractTextParts(nestedMessage);
  }

  return [];
}

function estimateTextTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  // Coarse approximation good enough to account for turns created after the
  // last provider-reported usage sample.
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

function estimateMessageTokens(message: unknown): number {
  const text = extractTextParts(message).join("\n").trim();
  if (!text) {
    return 0;
  }

  return estimateTextTokens(text);
}

function findLastMeasuredAssistantIndex(messages: unknown[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (getMessageRole(messages[index]) !== "assistant") {
      continue;
    }
    const usage = readUsage(messages[index]);
    if (usage?.input || usage?.totalTokens) {
      return index;
    }
  }
  return -1;
}

export function computeComposerContextUsage(
  messages: unknown[],
  contextWindow?: number,
): ComposerContextUsageData | null {
  const capacity =
    typeof contextWindow === "number" && Number.isFinite(contextWindow)
      ? Math.max(0, contextWindow)
      : 0;
  const safeMessages = Array.isArray(messages) ? messages : [];

  let usedTokens = 0;
  const lastMeasuredAssistantIndex = findLastMeasuredAssistantIndex(safeMessages);

  if (lastMeasuredAssistantIndex >= 0) {
    const usage = readUsage(safeMessages[lastMeasuredAssistantIndex]);
    usedTokens = Math.max(0, usage?.input ?? usage?.totalTokens ?? 0);

    for (let index = lastMeasuredAssistantIndex + 1; index < safeMessages.length; index += 1) {
      usedTokens += estimateMessageTokens(safeMessages[index]);
    }
  } else {
    for (const message of safeMessages) {
      usedTokens += estimateMessageTokens(message);
    }
  }

  const boundedUsed = capacity > 0 ? Math.min(usedTokens, capacity) : usedTokens;
  const ratio = capacity > 0 ? boundedUsed / capacity : 0;
  const percentage = Math.round(Math.max(0, Math.min(1, ratio)) * 100);

  return {
    usedTokens: boundedUsed,
    contextWindow: capacity,
    percentage,
  };
}

