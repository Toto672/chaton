import crypto from "node:crypto";

import { getDb } from "../db/index.js";
import { insertConversation } from "../db/repos/conversations.js";
import type { DbConversation } from "../db/repos/conversations.js";
import type { PiRendererEvent } from "../pi-sdk-runtime.js";
import { archiveHarnessArtifacts, createRunId, updateFrontierForScore } from "./archive.js";
import { resolveBenchmarkWorkspace, sanitizeBenchmarkId } from "./bootstrap.js";
import {
  aggregateBenchmarkScore,
  aggregateProfileScore,
  buildDefaultBenchmark,
  buildEvaluationProfiles,
  scoreTaskResult,
} from "./benchmark.js";
import type {
  HarnessCandidate,
  HarnessEvaluationProfileScore,
  HarnessEvaluationTraceEvent,
  MetaHarnessBenchmarkDefinition,
  MetaHarnessEvaluationProfile,
  MetaHarnessTaskResult,
} from "./types.js";

type RuntimeFacade = {
  start: (
    conversation: DbConversation,
    options?: { harnessCandidate?: HarnessCandidate | null },
  ) => Promise<void>;
  send: (command: { type: "prompt"; message: string }) => Promise<{ success: boolean; error?: string }>;
  getSnapshot: () => { state: unknown; messages: unknown[]; status: string };
  stop: () => Promise<void>;
};

function buildEphemeralConversation(
  task: MetaHarnessBenchmarkDefinition["tasks"][number],
  runId: string,
  profile: MetaHarnessEvaluationProfile,
): DbConversation {
  const now = new Date().toISOString();
  return {
    id: `__meta_harness__:${runId}:${profile.id}:${task.id}:${crypto.randomUUID()}`,
    project_id: null,
    title: `Meta-Harness Eval ${profile.id} ${task.id}`,
    title_source: "manual",
    status: "active",
    is_relevant: 0,
    created_at: now,
    updated_at: now,
    last_message_at: now,
    pi_session_file: null,
    model_provider: profile.modelProvider ?? task.modelProvider ?? null,
    model_id: profile.modelId ?? task.modelId ?? null,
    thinking_level: profile.thinkingLevel ?? task.thinkingLevel ?? null,
    last_runtime_error: null,
    worktree_path: task.workingDirectory ?? null,
    access_mode: task.accessMode === "open" ? "open" : "secure",
    channel_extension_id: null,
    hidden_from_sidebar: 1,
    memory_injected: 0,
    runtime_location: "local",
    cloud_runtime_session_id: null,
  };
}

async function evaluateProfile(params: {
  agentDir: string;
  runId: string;
  candidate: HarnessCandidate;
  profile: MetaHarnessEvaluationProfile;
  workspaceRoot: string;
}): Promise<{
  profileScore: HarnessEvaluationProfileScore;
  taskResults: MetaHarnessTaskResult[];
}> {
  const benchmark = params.profile.benchmark ?? buildDefaultBenchmark();
  const taskResults: MetaHarnessTaskResult[] = [];
  const manager = globalThis as Record<string, unknown>;
  const runtimeFactory = manager.__chatonsMetaHarnessRuntimeFactory as
    | ((conversationId: string, onEvent: (payload: PiRendererEvent) => void) => RuntimeFacade)
    | undefined;
  if (!runtimeFactory) {
    throw new Error("Meta-Harness runtime factory is not available");
  }

  for (const task of benchmark.tasks) {
    const conversation = buildEphemeralConversation(
      {
        ...task,
        workingDirectory: resolveBenchmarkWorkspace(params.workspaceRoot, task.workingDirectory),
      },
      params.runId,
      params.profile,
    );

    const db = getDb();
    insertConversation(db, {
      id: conversation.id,
      title: conversation.title,
      titleSource: "manual",
      isRelevant: false,
      modelProvider: conversation.model_provider,
      modelId: conversation.model_id,
      thinkingLevel: conversation.thinking_level,
      worktreePath: conversation.worktree_path,
      accessMode: conversation.access_mode,
      hiddenFromSidebar: true,
      memoryInjected: false,
      runtimeLocation: "local",
    });

    const traceEvents: HarnessEvaluationTraceEvent[] = [];
    const runtime = runtimeFactory(conversation.id, (payload: PiRendererEvent) => {
      traceEvents.push({
        timestamp: new Date().toISOString(),
        profileId: params.profile.id,
        taskId: task.id,
        event: payload.event,
      });
    });

    const startedAt = Date.now();
    let outputText: string | undefined;
    let errorMessage: string | undefined;
    try {
      await runtime.start(conversation, { harnessCandidate: params.candidate });
      const response = await runtime.send({ type: "prompt", message: task.prompt });
      if (!response.success) {
        errorMessage = typeof response.error === "string" ? response.error : "Evaluation prompt failed";
      }
      const snapshot = runtime.getSnapshot();
      const lastAssistant = [...snapshot.messages].reverse().find((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const role = (entry as Record<string, unknown>).role;
        return role === "assistant";
      }) as Record<string, unknown> | undefined;
      if (lastAssistant && Array.isArray(lastAssistant.content)) {
        outputText = lastAssistant.content
          .map((part) => {
            if (!part || typeof part !== "object") return "";
            const record = part as Record<string, unknown>;
            return record.type === "text" && typeof record.text === "string" ? record.text : "";
          })
          .filter((text) => text.trim().length > 0)
          .join("\n\n") || undefined;
      }

      archiveHarnessArtifacts({
        agentDir: params.agentDir,
        benchmarkId: params.profile.benchmarkId,
        runId: params.runId,
        candidate: params.candidate,
        promptSections: [],
        traceEvents,
        summary: {
          profileId: params.profile.id,
          taskId: task.id,
          success: !errorMessage,
        },
      });
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      await runtime.stop();
    }

    const latencyMs = Date.now() - startedAt;
    const toolCalls = traceEvents.filter((entry) => {
      if (!entry.event || typeof entry.event !== "object") return false;
      return (entry.event as Record<string, unknown>).type === "tool_execution_start";
    }).length;

    taskResults.push(
      scoreTaskResult({
        taskId: `${params.profile.id}:${task.id}`,
        latencyMs,
        toolCalls,
        outputText,
        errorMessage,
        expectedIncludes: task.expectedIncludes,
        expectedIncludesAny: task.expectedIncludesAny,
        expectedRegex: task.expectedRegex,
        expectedRegexAny: task.expectedRegexAny,
        expectedRegexAnyMin: task.expectedRegexAnyMin,
      }),
    );
  }

  const profileScore = aggregateProfileScore({
    profile: params.profile,
    candidate: params.candidate,
    taskResults,
  });

  return {
    profileScore,
    taskResults,
  };
}

export async function evaluateHarnessCandidate(params: {
  agentDir: string;
  candidate: HarnessCandidate;
  benchmark?: MetaHarnessBenchmarkDefinition;
  benchmarkId?: string;
  workspaceRoot: string;
  validationModelProvider?: string | null;
  validationModelId?: string | null;
  validationThinkingLevel?: string | null;
  baselineProfileScores?: HarnessEvaluationProfileScore[];
}): Promise<{
  benchmarkId: string;
  runId: string;
  score: ReturnType<typeof aggregateBenchmarkScore>;
  frontier: ReturnType<typeof updateFrontierForScore>;
}> {
  const benchmark = params.benchmark ?? buildDefaultBenchmark();
  const benchmarkId = sanitizeBenchmarkId(params.benchmarkId ?? benchmark.id);
  const runId = createRunId();
  const profiles = buildEvaluationProfiles({
    benchmark,
    benchmarkId,
    sentinelModelProvider: params.validationModelProvider ?? null,
    sentinelModelId: params.validationModelId ?? null,
    sentinelThinkingLevel: params.validationThinkingLevel ?? null,
  });

  const profileScores: HarnessEvaluationProfileScore[] = [];
  const allTaskResults: MetaHarnessTaskResult[] = [];

  for (const profile of profiles) {
    const result = await evaluateProfile({
      agentDir: params.agentDir,
      runId,
      candidate: params.candidate,
      profile,
      workspaceRoot: params.workspaceRoot,
    });
    profileScores.push(result.profileScore);
    allTaskResults.push(...result.taskResults);
  }

  const primaryProfile = profileScores[0];
  const score = aggregateBenchmarkScore({
    benchmarkId,
    runId,
    candidate: params.candidate,
    taskResults: primaryProfile?.taskResults ?? allTaskResults,
    profileScores,
    baselineProfileScores: params.baselineProfileScores,
  });
  const frontier = updateFrontierForScore(params.agentDir, benchmarkId, score);
  archiveHarnessArtifacts({
    agentDir: params.agentDir,
    benchmarkId,
    runId,
    candidate: params.candidate,
    promptSections: [],
    score,
    summary: {
      benchmarkId,
      candidateId: params.candidate.id,
      successRate: score.successRate,
      averageLatencyMs: score.averageLatencyMs,
      totalToolCalls: score.totalToolCalls,
      robustnessScore: score.robustnessScore ?? null,
      scoreStddev: score.scoreStddev ?? null,
      worstProfileScore: score.worstProfileScore ?? null,
      profileIds: profileScores.map((profile) => profile.profileId),
    },
  });

  return { benchmarkId, runId, score, frontier };
}
