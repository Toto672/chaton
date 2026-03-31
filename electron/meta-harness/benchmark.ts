import type {
  HarnessCandidate,
  HarnessEvaluationProfileScore,
  HarnessEvaluationScore,
  MetaHarnessBenchmarkDefinition,
  MetaHarnessEvaluationProfile,
  MetaHarnessTaskResult,
} from "./types.js";
import { getDb } from "../db/index.js";
import { getHarnessFeedbackStats } from "../db/repos/meta-harness-feedback.js";

export function buildDefaultBenchmark(): MetaHarnessBenchmarkDefinition {
  return {
    id: "environment-bootstrap-smoke",
    tasks: [
      {
        id: "cwd-and-toolchain",
        prompt:
          "Briefly report the current working directory and mention at least one detected toolchain version if available.",
        expectedIncludesAny: ["directory", "working directory", "cwd"],
        expectedRegexAny: [
          String.raw`(/users/|/home/|/workspace/|/tmp/|/var/|[a-z]:\\)`,
          String.raw`\b(node(\.js)?|npm|pnpm|python|rust|cargo|git|ruby|java)\b[^\n]*\b(v?\d+[\w.:-]*)`,
        ],
        expectedRegexAnyMin: 2,
      },
      {
        id: "repo-shape",
        prompt:
          "Briefly summarize the top-level repository contents or workspace shape before making any changes.",
        expectedIncludesAny: ["repository", "repo", "workspace", "monorepo", "project"],
        expectedRegexAny: [
          String.raw`\b(src|electron|docs|apps|packages|landing|extension-registry|scripts|dist)\b`,
          String.raw`\b(repository|repo|workspace|monorepo|project)\b`,
        ],
        expectedRegexAnyMin: 2,
      },
    ],
  };
}

export function buildEvaluationProfiles(params: {
  benchmark?: MetaHarnessBenchmarkDefinition;
  benchmarkId?: string;
  sentinelModelProvider?: string | null;
  sentinelModelId?: string | null;
  sentinelThinkingLevel?: string | null;
}): MetaHarnessEvaluationProfile[] {
  const benchmark = params.benchmark ?? buildDefaultBenchmark();
  const benchmarkId = params.benchmarkId?.trim() || benchmark.id;
  const profiles: MetaHarnessEvaluationProfile[] = [
    {
      id: `${benchmarkId}:primary`,
      benchmarkId,
      benchmark,
      weight: 1,
    },
  ];

  if (params.sentinelModelProvider && params.sentinelModelId) {
    profiles.push({
      id: `${benchmarkId}:sentinel`,
      benchmarkId,
      benchmark,
      modelProvider: params.sentinelModelProvider,
      modelId: params.sentinelModelId,
      thinkingLevel: params.sentinelThinkingLevel ?? null,
      weight: 1,
    });
  }

  return profiles;
}

function countMatchingRegexes(patterns: string[] | undefined, outputText: string): number {
  if (!patterns || patterns.length === 0) return 0;
  return patterns.reduce((count, pattern) => {
    try {
      return new RegExp(pattern, "i").test(outputText) ? count + 1 : count;
    } catch {
      return count;
    }
  }, 0);
}

function mean(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function weightedMean(values: Array<{ value: number; weight: number }>): number {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function weightedStddev(values: Array<{ value: number; weight: number }>): number {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0 || values.length <= 1) return 0;
  const avg = weightedMean(values);
  const variance = values.reduce((sum, item) => sum + item.weight * ((item.value - avg) ** 2), 0) / totalWeight;
  return Math.sqrt(Math.max(0, variance));
}

export function scalarizeProfileScore(params: {
  successRate: number;
  averageLatencyMs: number;
  totalToolCalls: number;
  humanFeedbackScore?: number | null;
  humanFeedbackCount?: number;
}): number {
  const humanBoost =
    typeof params.humanFeedbackScore === "number"
      ? params.humanFeedbackScore * Math.min(0.2, Math.max(0.05, (params.humanFeedbackCount ?? 0) * 0.02))
      : 0;

  return (
    params.successRate
    - params.averageLatencyMs / 100000
    - params.totalToolCalls / 10000
    + humanBoost
  );
}

export function scoreTaskResult(params: {
  taskId: string;
  latencyMs: number;
  toolCalls: number;
  outputText?: string;
  errorMessage?: string;
  expectedIncludes?: string[];
  expectedIncludesAny?: string[];
  expectedRegex?: string[];
  expectedRegexAny?: string[];
  expectedRegexAnyMin?: number;
}): MetaHarnessTaskResult {
  const outputText = params.outputText?.trim();
  let success = !params.errorMessage && !!outputText;

  if (success && params.expectedIncludes && params.expectedIncludes.length > 0) {
    const lowered = outputText!.toLowerCase();
    success = params.expectedIncludes.every((needle) => lowered.includes(needle.toLowerCase()));
  }
  if (success && params.expectedIncludesAny && params.expectedIncludesAny.length > 0) {
    const lowered = outputText!.toLowerCase();
    success = params.expectedIncludesAny.some((needle) => lowered.includes(needle.toLowerCase()));
  }
  if (success && params.expectedRegex && params.expectedRegex.length > 0) {
    success = params.expectedRegex.every((pattern) => {
      try {
        return new RegExp(pattern, "i").test(outputText ?? "");
      } catch {
        return true;
      }
    });
  }
  if (success && params.expectedRegexAny && params.expectedRegexAny.length > 0) {
    const matchCount = countMatchingRegexes(params.expectedRegexAny, outputText ?? "");
    success = matchCount >= (params.expectedRegexAnyMin ?? 1);
  }

  return {
    taskId: params.taskId,
    success,
    latencyMs: params.latencyMs,
    toolCalls: params.toolCalls,
    ...(outputText ? { outputText } : {}),
    ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
  };
}

export function aggregateProfileScore(params: {
  profile: MetaHarnessEvaluationProfile;
  candidate: HarnessCandidate;
  taskResults: MetaHarnessTaskResult[];
  humanFeedbackScore?: number | null;
  humanFeedbackCount?: number;
}): HarnessEvaluationProfileScore {
  const taskResults = params.taskResults;
  const successCount = taskResults.filter((item) => item.success).length;
  const averageLatencyMs =
    taskResults.length > 0
      ? taskResults.reduce((sum, item) => sum + item.latencyMs, 0) / taskResults.length
      : 0;
  const totalToolCalls = taskResults.reduce((sum, item) => sum + item.toolCalls, 0);

  return {
    profileId: params.profile.id,
    benchmarkId: params.profile.benchmarkId,
    modelProvider: params.profile.modelProvider ?? null,
    modelId: params.profile.modelId ?? null,
    thinkingLevel: params.profile.thinkingLevel ?? null,
    weight: params.profile.weight ?? 1,
    successRate: taskResults.length > 0 ? successCount / taskResults.length : 0,
    averageLatencyMs,
    totalToolCalls,
    tokenCost: null,
    scalarScore: scalarizeProfileScore({
      successRate: taskResults.length > 0 ? successCount / taskResults.length : 0,
      averageLatencyMs,
      totalToolCalls,
      humanFeedbackScore: params.humanFeedbackScore,
      humanFeedbackCount: params.humanFeedbackCount,
    }),
    taskResults,
  };
}

export function aggregateRobustScore(params: {
  profileScores: HarnessEvaluationProfileScore[];
  baselineProfileScores?: HarnessEvaluationProfileScore[];
}): {
  robustnessScore: number;
  scoreStddev: number;
  worstProfileScore: number;
  regressionPenalty: number;
  worstCasePenalty: number;
} {
  const weightedScores = params.profileScores.map((profile) => ({
    value: profile.scalarScore,
    weight: profile.weight ?? 1,
  }));
  const avg = weightedMean(weightedScores);
  const sd = weightedStddev(weightedScores);
  const worst = params.profileScores.length > 0
    ? Math.min(...params.profileScores.map((profile) => profile.scalarScore))
    : Number.NEGATIVE_INFINITY;

  let regressionPenalty = 0;
  if (params.baselineProfileScores && params.baselineProfileScores.length > 0) {
    const baselineById = new Map(
      params.baselineProfileScores.map((profile) => [profile.profileId, profile.scalarScore]),
    );

    for (const profile of params.profileScores) {
      const baseline = baselineById.get(profile.profileId);
      if (typeof baseline !== "number") continue;
      const delta = profile.scalarScore - baseline;
      if (delta < -0.03) {
        regressionPenalty += Math.abs(delta) * 2.5 * (profile.weight ?? 1);
      }
    }
  }

  const worstCasePenalty = worst < 0.55 ? (0.55 - worst) * 1.5 : 0;
  return {
    robustnessScore: avg - 0.75 * sd - regressionPenalty - worstCasePenalty,
    scoreStddev: sd,
    worstProfileScore: worst,
    regressionPenalty,
    worstCasePenalty,
  };
}

export function aggregateBenchmarkScore(params: {
  benchmarkId: string;
  runId: string;
  candidate: HarnessCandidate;
  taskResults: MetaHarnessTaskResult[];
  profileScores?: HarnessEvaluationProfileScore[];
  baselineProfileScores?: HarnessEvaluationProfileScore[];
}): HarnessEvaluationScore {
  const taskResults = params.taskResults;
  const successCount = taskResults.filter((item) => item.success).length;
  const averageLatencyMs =
    taskResults.length > 0
      ? taskResults.reduce((sum, item) => sum + item.latencyMs, 0) / taskResults.length
      : 0;
  const totalToolCalls = taskResults.reduce((sum, item) => sum + item.toolCalls, 0);
  const humanFeedback = getHarnessFeedbackStats(getDb(), params.candidate.id);
  const profileScores = params.profileScores ?? [];
  const robust = profileScores.length > 0
    ? aggregateRobustScore({
        profileScores,
        baselineProfileScores: params.baselineProfileScores,
      })
    : null;

  return {
    benchmarkId: params.benchmarkId,
    runId: params.runId,
    candidateId: params.candidate.id,
    objectives: params.candidate.scoring?.objectives ?? ["successRate", "latency", "toolCalls", "tokenCost"],
    successRate: taskResults.length > 0 ? successCount / taskResults.length : 0,
    averageLatencyMs,
    totalToolCalls,
    tokenCost: null,
    humanFeedbackScore: humanFeedback.score,
    humanFeedbackCount: humanFeedback.total,
    taskResults,
    ...(profileScores.length > 0 ? { profileScores } : {}),
    ...(robust ? {
      robustnessScore: robust.robustnessScore,
      scoreStddev: robust.scoreStddev,
      worstProfileScore: robust.worstProfileScore,
      regressionPenalty: robust.regressionPenalty,
      worstCasePenalty: robust.worstCasePenalty,
    } : {}),
    createdAt: new Date().toISOString(),
  };
}
