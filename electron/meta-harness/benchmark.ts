import type { HarnessCandidate, HarnessEvaluationScore, MetaHarnessBenchmarkDefinition, MetaHarnessTaskResult } from "./types.js";

export function buildDefaultBenchmark(): MetaHarnessBenchmarkDefinition {
  return {
    id: "environment-bootstrap-smoke",
    tasks: [
      {
        id: "cwd-and-toolchain",
        prompt:
          "Briefly report the current working directory and mention at least one detected toolchain version if available.",
        expectedIncludes: ["directory"],
      },
      {
        id: "repo-shape",
        prompt:
          "Briefly summarize the top-level repository contents or workspace shape before making any changes.",
        expectedIncludes: ["repository"],
      },
    ],
  };
}

export function scoreTaskResult(params: {
  taskId: string;
  latencyMs: number;
  toolCalls: number;
  outputText?: string;
  errorMessage?: string;
  expectedIncludes?: string[];
  expectedRegex?: string[];
}): MetaHarnessTaskResult {
  const outputText = params.outputText?.trim();
  let success = !params.errorMessage && !!outputText;

  if (success && params.expectedIncludes && params.expectedIncludes.length > 0) {
    const lowered = outputText!.toLowerCase();
    success = params.expectedIncludes.every((needle) => lowered.includes(needle.toLowerCase()));
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

  return {
    taskId: params.taskId,
    success,
    latencyMs: params.latencyMs,
    toolCalls: params.toolCalls,
    ...(outputText ? { outputText } : {}),
    ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
  };
}

export function aggregateBenchmarkScore(params: {
  benchmarkId: string;
  runId: string;
  candidate: HarnessCandidate;
  taskResults: MetaHarnessTaskResult[];
}): HarnessEvaluationScore {
  const taskResults = params.taskResults;
  const successCount = taskResults.filter((item) => item.success).length;
  const averageLatencyMs =
    taskResults.length > 0
      ? taskResults.reduce((sum, item) => sum + item.latencyMs, 0) / taskResults.length
      : 0;
  const totalToolCalls = taskResults.reduce((sum, item) => sum + item.toolCalls, 0);
  return {
    benchmarkId: params.benchmarkId,
    runId: params.runId,
    candidateId: params.candidate.id,
    objectives: params.candidate.scoring?.objectives ?? ["successRate", "latency", "toolCalls", "tokenCost"],
    successRate: taskResults.length > 0 ? successCount / taskResults.length : 0,
    averageLatencyMs,
    totalToolCalls,
    tokenCost: null,
    taskResults,
    createdAt: new Date().toISOString(),
  };
}
