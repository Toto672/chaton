import fs from "node:fs";
import path from "node:path";

import { getDefaultHarnessCandidate, getMetaHarnessRoot } from "./candidate.js";
import type {
  MetaHarnessOptimizerAttempt,
  MetaHarnessOptimizerConfig,
  MetaHarnessOptimizerRunState,
} from "./optimizer-types.js";
import { buildDefaultBenchmark } from "./benchmark.js";

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function safeWriteJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function getOptimizerRoot(agentDir: string): string {
  return path.join(getMetaHarnessRoot(agentDir), "optimizer");
}

export function getOptimizerStateFile(agentDir: string): string {
  return path.join(getOptimizerRoot(agentDir), "state.json");
}

export function getOptimizerAttemptsRoot(agentDir: string, runId: string): string {
  return path.join(getOptimizerRoot(agentDir), "runs", runId, "attempts");
}

export function buildDefaultOptimizerConfig(): MetaHarnessOptimizerConfig {
  return {
    benchmarkId: buildDefaultBenchmark().id,
    optimizerModelProvider: "",
    optimizerModelId: "",
    optimizerThinkingLevel: "medium",
    autoPromote: true,
    loop: true,
    maxIterations: null,
    maxVariantsPerIteration: 2,
    minScoreDelta: 0.01,
    sleepMs: 1500,
    validationModelProvider: null,
    validationModelId: null,
    validationThinkingLevel: "medium",
  };
}

export function getDefaultOptimizerState(): MetaHarnessOptimizerRunState {
  const baseline = getDefaultHarnessCandidate();
  const config = buildDefaultOptimizerConfig();
  return {
    runId: null,
    status: "idle",
    phase: "idle",
    benchmarkId: config.benchmarkId,
    optimizerModelProvider: config.optimizerModelProvider,
    optimizerModelId: config.optimizerModelId,
    optimizerThinkingLevel: config.optimizerThinkingLevel,
    validationModelProvider: config.validationModelProvider,
    validationModelId: config.validationModelId,
    validationThinkingLevel: config.validationThinkingLevel,
    iteration: 0,
    stopRequested: false,
    autoPromote: config.autoPromote,
    loop: config.loop,
    maxIterations: config.maxIterations,
    maxVariantsPerIteration: config.maxVariantsPerIteration,
    minScoreDelta: config.minScoreDelta,
    sleepMs: config.sleepMs,
    activeCandidateId: baseline.id,
    bestCandidateId: baseline.id,
  };
}

export function readOptimizerState(agentDir: string): MetaHarnessOptimizerRunState {
  return safeReadJson<MetaHarnessOptimizerRunState>(getOptimizerStateFile(agentDir)) ?? getDefaultOptimizerState();
}

export function writeOptimizerState(agentDir: string, state: MetaHarnessOptimizerRunState): MetaHarnessOptimizerRunState {
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  safeWriteJson(getOptimizerStateFile(agentDir), nextState);
  return nextState;
}

export function appendOptimizerAttempt(agentDir: string, attempt: MetaHarnessOptimizerAttempt): void {
  const filePath = path.join(getOptimizerAttemptsRoot(agentDir, attempt.runId), `${attempt.attemptId}.json`);
  safeWriteJson(filePath, attempt);
}

export function listOptimizerAttempts(agentDir: string, runId?: string | null): MetaHarnessOptimizerAttempt[] {
  const resolvedRunId = runId?.trim() || readOptimizerState(agentDir).runId;
  if (!resolvedRunId) return [];
  const dir = getOptimizerAttemptsRoot(agentDir, resolvedRunId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => safeReadJson<MetaHarnessOptimizerAttempt>(path.join(dir, name)))
    .filter((item): item is MetaHarnessOptimizerAttempt => !!item)
    .sort((left, right) => left.iteration - right.iteration || left.startedAt.localeCompare(right.startedAt));
}
