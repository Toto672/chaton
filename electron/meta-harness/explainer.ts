import crypto from "node:crypto";

import { getDb } from "../db/index.js";
import {
  deleteConversationById,
  insertConversation,
} from "../db/repos/conversations.js";
import { piSessionRuntimeManager } from "../pi-runtime-singleton.js";
import { getModels, getSettings } from "../lib/pi/pi-manager.js";

export type MetaHarnessAttemptResult = {
  runId: string;
  attemptId: string | null;
  attempt: Record<string, unknown> | null;
  selectedCandidateId: string | null;
  candidate: Record<string, unknown> | null;
  score: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
  promptText: string | null;
  envSnapshotText: string | null;
  traceText: string | null;
  diffPatch: string | null;
};

export type MetaHarnessHumanReportAction = {
  title: string;
  rationale: string;
  implementation: string;
  priority: "high" | "medium" | "low";
  filesOrAreas: string[];
};

export type MetaHarnessHumanReport = {
  title: string;
  summary: string;
  mainDiscovery: string;
  recommendation: "adopt" | "iterate" | "reject";
  findings: string[];
  evidence: string[];
  actions: MetaHarnessHumanReportAction[];
  risks: string[];
};

function normalizeModelOption(model: { provider?: unknown; id?: unknown; name?: unknown }) {
  const provider = String(model.provider ?? "").trim();
  const rawId = String(model.id ?? "").trim();
  const name = String(model.name ?? rawId).trim();
  if (!provider || !rawId) return null;

  const providerPrefix = `${provider}/`;
  const id = rawId.startsWith(providerPrefix)
    ? rawId.slice(providerPrefix.length)
    : rawId;
  if (!id) return null;

  return {
    provider,
    id,
    key: `${provider}/${id}`,
    label: `${provider} / ${name.startsWith(providerPrefix) ? name.slice(providerPrefix.length) : name}`,
  };
}

function parseModelKey(modelKey: string | null | undefined): { provider: string; modelId: string } | null {
  const normalized = typeof modelKey === "string" ? modelKey.trim() : "";
  const separatorIndex = normalized.indexOf("/");
  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return null;
  }
  return {
    provider: normalized.slice(0, separatorIndex),
    modelId: normalized.slice(separatorIndex + 1),
  };
}

function resolveExplanationModel(): { provider: string; modelId: string } {
  const settings = getSettings() as Record<string, unknown>;
  const preferred = parseModelKey(
    typeof settings.defaultModel === "string" ? settings.defaultModel : null,
  );
  if (preferred) {
    return preferred;
  }

  const defaultProvider =
    typeof settings.defaultProvider === "string"
      ? settings.defaultProvider.trim()
      : "";
  const fallbackDefaultModel =
    typeof settings.defaultModel === "string"
      ? settings.defaultModel.trim()
      : "";
  if (defaultProvider && fallbackDefaultModel && !fallbackDefaultModel.includes("/")) {
    return {
      provider: defaultProvider,
      modelId: fallbackDefaultModel,
    };
  }

  const modelOptions = (getModels() ?? [])
    .map((model) => normalizeModelOption(model))
    .filter((model): model is NonNullable<typeof model> => Boolean(model));
  const firstModel = modelOptions[0];
  if (firstModel) {
    return {
      provider: firstModel.provider,
      modelId: firstModel.id,
    };
  }

  throw new Error("No model available to generate a harness explanation");
}

function extractAssistantTextFromSnapshot(snapshot: { messages?: unknown[] } | null | undefined): string | null {
  const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as Record<string, unknown> | null;
    if (!message) continue;
    const role =
      (typeof message.role === "string"
        ? message.role
        : ((message.message as Record<string, unknown> | undefined)?.role as string | undefined)) ?? "";
    if (role !== "assistant") continue;
    const content = Array.isArray(message.content)
      ? message.content
      : Array.isArray((message.message as Record<string, unknown> | undefined)?.content)
        ? ((message.message as Record<string, unknown> | undefined)?.content as unknown[])
        : [];
    const textParts = content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const record = part as Record<string, unknown>;
        if (record.type === "text" && typeof record.text === "string") {
          return record.text;
        }
        return "";
      })
      .filter((part) => part.trim().length > 0);
    if (textParts.length > 0) {
      return textParts.join("\n\n").trim();
    }
  }
  return null;
}

function stripCodeFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = stripCodeFences(raw);
  const direct = cleaned.trim();
  if (!direct) return null;
  try {
    return JSON.parse(direct) as Record<string, unknown>;
  } catch {
    const firstBrace = direct.indexOf("{");
    const lastBrace = direct.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const maybeJson = direct.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(maybeJson) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function limitText(label: string, value: string | null | undefined, maxChars: number): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    return `${label}: (none)`;
  }
  const sliced = normalized.length > maxChars
    ? `${normalized.slice(0, maxChars)}\n... [truncated ${normalized.length - maxChars} chars]`
    : normalized;
  return `${label}:\n${sliced}`;
}

function ensureStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function ensureRecommendation(value: unknown): MetaHarnessHumanReport["recommendation"] {
  return value === "adopt" || value === "reject" || value === "iterate"
    ? value
    : "iterate";
}

function ensurePriority(value: unknown): MetaHarnessHumanReportAction["priority"] {
  return value === "high" || value === "low" || value === "medium"
    ? value
    : "medium";
}

function buildFallbackReport(result: MetaHarnessAttemptResult): MetaHarnessHumanReport {
  const score = result.score ?? null;
  const robustness = typeof score?.robustnessScore === "number" ? score.robustnessScore : null;
  const successRate = typeof score?.successRate === "number" ? score.successRate : null;
  const latencyMs = typeof score?.averageLatencyMs === "number" ? score.averageLatencyMs : null;

  return {
    title: `Harness result ${result.selectedCandidateId ?? "candidate"}`,
    summary:
      "This result includes the raw harness artifacts, but the automatic explanation could not be generated. Review the prompt, summary, and trace to decide whether the candidate should be adopted or iterated on.",
    mainDiscovery:
      "Automatic explanation generation failed, so this view falls back to the raw evidence gathered by the harness.",
    recommendation: "iterate",
    findings: [
      robustness !== null ? `Robustness score: ${robustness.toFixed(2)}.` : "Robustness score was not available.",
      successRate !== null ? `Success rate: ${Math.round(successRate * 100)}%.` : "Success rate was not available.",
      latencyMs !== null ? `Average latency: ${Math.round(latencyMs)} ms.` : "Latency was not available.",
    ],
    evidence: [
      result.summary ? "A machine-readable summary artifact is available." : "No summary artifact was available.",
      result.promptText ? "Prompt text is available for inspection." : "Prompt text was not available.",
      result.traceText ? "Trace output is available for inspection." : "Trace output was not available.",
    ],
    actions: [
      {
        title: "Inspect the raw harness artifacts",
        rationale: "The generated explanation is unavailable, so the decision must come from the recorded evidence.",
        implementation: "Read the prompt, summary, trace, and diff to identify what changed in the candidate and whether the score improvements are trustworthy.",
        priority: "high",
        filesOrAreas: ["meta-harness results modal"],
      },
    ],
    risks: [
      "The human-readable interpretation is missing, so score changes may be misleading without manual review.",
    ],
  };
}

function coerceHumanReport(parsed: Record<string, unknown> | null, fallback: MetaHarnessAttemptResult): MetaHarnessHumanReport {
  if (!parsed) {
    return buildFallbackReport(fallback);
  }

  const actions = Array.isArray(parsed.actions)
    ? parsed.actions
        .map((action) => {
          if (!action || typeof action !== "object") return null;
          const record = action as Record<string, unknown>;
          const title = typeof record.title === "string" ? record.title.trim() : "";
          const rationale = typeof record.rationale === "string" ? record.rationale.trim() : "";
          const implementation = typeof record.implementation === "string" ? record.implementation.trim() : "";
          if (!title || !rationale || !implementation) return null;
          return {
            title,
            rationale,
            implementation,
            priority: ensurePriority(record.priority),
            filesOrAreas: ensureStringArray(record.filesOrAreas, ["codebase"]),
          } satisfies MetaHarnessHumanReportAction;
        })
        .filter((action): action is MetaHarnessHumanReportAction => Boolean(action))
    : [];

  const title = typeof parsed.title === "string" && parsed.title.trim().length > 0
    ? parsed.title.trim()
    : `Harness result ${fallback.selectedCandidateId ?? "candidate"}`;
  const summary = typeof parsed.summary === "string" && parsed.summary.trim().length > 0
    ? parsed.summary.trim()
    : buildFallbackReport(fallback).summary;
  const mainDiscovery = typeof parsed.mainDiscovery === "string" && parsed.mainDiscovery.trim().length > 0
    ? parsed.mainDiscovery.trim()
    : buildFallbackReport(fallback).mainDiscovery;

  return {
    title,
    summary,
    mainDiscovery,
    recommendation: ensureRecommendation(parsed.recommendation),
    findings: ensureStringArray(parsed.findings, buildFallbackReport(fallback).findings),
    evidence: ensureStringArray(parsed.evidence, buildFallbackReport(fallback).evidence),
    actions: actions.length > 0 ? actions : buildFallbackReport(fallback).actions,
    risks: ensureStringArray(parsed.risks, buildFallbackReport(fallback).risks),
  };
}

function buildExplanationPrompt(result: MetaHarnessAttemptResult): string {
  const score = result.score && typeof result.score === "object"
    ? JSON.stringify(result.score, null, 2)
    : "null";
  const summary = result.summary && typeof result.summary === "object"
    ? JSON.stringify(result.summary, null, 2)
    : "null";
  const candidate = result.candidate && typeof result.candidate === "object"
    ? JSON.stringify(result.candidate, null, 2)
    : "null";
  const attempt = result.attempt && typeof result.attempt === "object"
    ? JSON.stringify(result.attempt, null, 2)
    : "null";

  return [
    "You are helping maintainers understand a Meta-Harness evaluation result.",
    "Turn the raw artifacts into a human-readable report that explains what the harness discovered and what changes the team could make in the codebase.",
    "Be concrete, pragmatic, and avoid vague benchmarking language.",
    "If the evidence is weak or conflicting, say so clearly.",
    "Return ONLY valid JSON matching this exact schema:",
    JSON.stringify({
      title: "short title",
      summary: "2-4 sentence plain-English summary",
      mainDiscovery: "single most important discovery",
      recommendation: "adopt",
      findings: ["finding 1", "finding 2"],
      evidence: ["evidence 1", "evidence 2"],
      actions: [
        {
          title: "action title",
          rationale: "why this matters",
          implementation: "how to implement it in the code",
          priority: "high",
          filesOrAreas: ["relevant file or subsystem"],
        },
      ],
      risks: ["risk 1", "risk 2"],
    }, null, 2),
    "Use recommendation = adopt only if the result looks ready to integrate.",
    "Use recommendation = reject if the candidate looks clearly harmful or misleading.",
    "Otherwise use recommendation = iterate.",
    "Prefer at most 5 findings, 5 evidence bullets, 5 actions, and 4 risks.",
    "Mention specific files or subsystems only when the artifacts support that suggestion.",
    "",
    `Run id: ${result.runId}`,
    `Attempt id: ${result.attemptId ?? "n/a"}`,
    `Candidate id: ${result.selectedCandidateId ?? "n/a"}`,
    "",
    `Attempt metadata:\n${attempt}`,
    "",
    `Candidate metadata:\n${candidate}`,
    "",
    `Score:\n${score}`,
    "",
    `Summary artifact:\n${summary}`,
    "",
    limitText("Prompt text", result.promptText, 5000),
    "",
    limitText("Environment snapshot", result.envSnapshotText, 4000),
    "",
    limitText("Diff patch", result.diffPatch, 4000),
    "",
    limitText("Trace", result.traceText, 6000),
  ].join("\n");
}

export async function generateMetaHarnessHumanReport(
  result: MetaHarnessAttemptResult,
): Promise<MetaHarnessHumanReport> {
  const model = resolveExplanationModel();
  const db = getDb();
  const conversationId = `meta-harness-explainer-${Date.now()}-${crypto.randomUUID()}`;

  insertConversation(db, {
    id: conversationId,
    title: "Meta-Harness Explanation",
    modelProvider: model.provider,
    modelId: model.modelId,
    accessMode: "secure",
    hiddenFromSidebar: true,
  });

  try {
    const startResult = await piSessionRuntimeManager.start(conversationId);
    if (!startResult.ok) {
      throw new Error(startResult.message);
    }

    const setModelResponse = await piSessionRuntimeManager.sendCommand(
      conversationId,
      {
        type: "set_model",
        provider: model.provider,
        modelId: model.modelId,
      },
    );
    if (!setModelResponse.success) {
      throw new Error(setModelResponse.error ?? "Failed to select explanation model");
    }

    const promptResponse = await piSessionRuntimeManager.sendCommand(
      conversationId,
      {
        type: "prompt",
        message: buildExplanationPrompt(result),
      },
    );
    if (!promptResponse.success) {
      throw new Error(promptResponse.error ?? "Failed to generate harness explanation");
    }

    const snapshot = await piSessionRuntimeManager.getSnapshot(conversationId);
    const rawText = extractAssistantTextFromSnapshot(snapshot);
    const parsed = parseJsonObject(rawText ?? "");
    return coerceHumanReport(parsed, result);
  } finally {
    await piSessionRuntimeManager.stop(conversationId).catch(() => {});
    deleteConversationById(db, conversationId);
  }
}
