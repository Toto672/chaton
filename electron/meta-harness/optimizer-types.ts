import type { HarnessCandidate, HarnessEvaluationScore } from "./types.js";

export type MetaHarnessOptimizerStatus =
  | "idle"
  | "running"
  | "stopping"
  | "stopped"
  | "completed"
  | "error";

export type MetaHarnessOptimizerPhase =
  | "idle"
  | "planning"
  | "proposing"
  | "evaluating"
  | "ranking"
  | "promoting"
  | "sleeping"
  | "stopped"
  | "error";

export type MetaHarnessOptimizerConfig = {
  benchmarkId: string;
  optimizerModelProvider: string;
  optimizerModelId: string;
  optimizerThinkingLevel?: string | null;
  autoPromote: boolean;
  loop: boolean;
  maxIterations?: number | null;
  maxVariantsPerIteration: number;
  minScoreDelta: number;
  sleepMs: number;
  validationModelProvider?: string | null;
  validationModelId?: string | null;
  validationThinkingLevel?: string | null;
};

export type MetaHarnessOptimizerAttemptCandidate = {
  candidate: HarnessCandidate;
  parentCandidateId: string;
  rationale: string;
  score?: HarnessEvaluationScore;
  promoted?: boolean;
  rejectedReason?: string;
};

export type MetaHarnessOptimizerAttempt = {
  runId: string;
  attemptId: string;
  iteration: number;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "error" | "cancelled";
  phase: MetaHarnessOptimizerPhase;
  baseCandidateId: string;
  benchmarkId: string;
  summary?: string;
  errorMessage?: string;
  candidates: MetaHarnessOptimizerAttemptCandidate[];
};

export type MetaHarnessOptimizerRunState = {
  runId: string | null;
  status: MetaHarnessOptimizerStatus;
  phase: MetaHarnessOptimizerPhase;
  benchmarkId: string;
  optimizerModelProvider: string | null;
  optimizerModelId: string | null;
  optimizerThinkingLevel?: string | null;
  validationModelProvider?: string | null;
  validationModelId?: string | null;
  validationThinkingLevel?: string | null;
  startedAt?: string;
  updatedAt?: string;
  stoppedAt?: string;
  iteration: number;
  stopRequested: boolean;
  autoPromote: boolean;
  loop: boolean;
  maxIterations?: number | null;
  maxVariantsPerIteration: number;
  minScoreDelta: number;
  sleepMs: number;
  activeCandidateId: string | null;
  bestCandidateId: string | null;
  bestScore?: HarnessEvaluationScore;
  lastError?: string;
  lastAttemptId?: string;
};

export type MetaHarnessOptimizerProposal = {
  candidate: HarnessCandidate;
  rationale: string;
};
