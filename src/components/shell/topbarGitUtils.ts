import type { JsonValue } from "@/features/workspace/rpc";

import type {
  ConversationTouchedFile,
  GitChangeSection,
  GitChecklistState,
  GitReadiness,
  GitReviewStatus,
  WorktreeFileChange,
} from "./topbarGitTypes";

export function isSensitivePath(filePath: string) {
  const lower = filePath.toLowerCase();
  return [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.env',
    'auth',
    'token',
    'secret',
    'credential',
    'migration',
    'schema',
    'electron/',
    'main.ts',
    'workspace.ts',
  ].some((entry) => lower.includes(entry));
}

export function inferImpactLabel(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.includes('test') || lower.includes('__tests__') || lower.endsWith('.spec.ts') || lower.endsWith('.test.ts')) {
    return 'Tests';
  }
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) {
    return 'Documentation';
  }
  if (lower.includes('styles') || lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.tsx')) {
    return 'UI';
  }
  if (lower.includes('package.json') || lower.includes('lock') || lower.includes('config')) {
    return 'Configuration';
  }
  return 'Code';
}

export function summarizeDiffExcerpt(diff: string) {
  return diff
    .split('\n')
    .filter((line) => line.startsWith('+') || line.startsWith('-'))
    .slice(0, 8);
}

export function computeReviewStatus(args: {
  hasChanges: boolean;
  changedCount: number;
  reviewedCount: number;
  stagedCount: number;
  hasUnstaged: boolean;
  ahead: number;
  behind: number;
}): GitReviewStatus {
  if (!args.hasChanges || args.changedCount === 0) return 'draft';
  if (args.reviewedCount < args.changedCount) return 'needs-review';
  if (args.hasUnstaged || args.stagedCount < args.changedCount) return 'ready-to-commit';
  if (args.ahead > 0 || args.behind > 0) return 'ready-to-merge';
  return 'ready-to-commit';
}

export function reviewStatusLabel(status: GitReviewStatus, t: (value: string) => string) {
  switch (status) {
    case 'draft':
      return t('Brouillon');
    case 'needs-review':
      return t('Revue necessaire');
    case 'ready-to-commit':
      return t('Pret a commit');
    case 'ready-to-merge':
      return t('Pret a merger');
    default:
      return t('Brouillon');
  }
}

export function makeReviewStorageKey(conversationId: string) {
  return `chatons:git-review:${conversationId}`;
}

export function extractFileChangesFromMessages(messages: JsonValue[]): ConversationTouchedFile[] {
  const fileChanges: ConversationTouchedFile[] = [];
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const record = message as { content?: Array<{ type?: string; files?: ConversationTouchedFile[] }> };
    const content = Array.isArray(record.content) ? record.content : [];
    for (const part of content) {
      if (part?.type === 'fileChanges' && Array.isArray(part.files)) {
        fileChanges.push(...part.files);
      }
    }
  }
  return fileChanges;
}

export function dedupeTouchedFiles(files: ConversationTouchedFile[]) {
  const unique = new Map<string, ConversationTouchedFile>();
  files.forEach((file) => unique.set(file.path, file));
  return Array.from(unique.values());
}

export function extractRecentConversationDiffContext(messages: JsonValue[]): string[] {
  return dedupeTouchedFiles(extractFileChangesFromMessages(messages)).map(
    (file) => `${file.path} (+${file.added}/-${file.removed})`,
  );
}

export function makeChecklistStorageKey(conversationId: string) {
  return `chatons:git-checklist:${conversationId}`;
}

export function buildGitSections(args: {
  changes: WorktreeFileChange[];
  recentPaths: Set<string>;
}) {
  const recent = args.changes.filter((file) => args.recentPaths.has(file.path));
  const sensitive = args.changes.filter(
    (file) => !args.recentPaths.has(file.path) && isSensitivePath(file.path),
  );
  const staged = args.changes.filter(
    (file) => !args.recentPaths.has(file.path) && !isSensitivePath(file.path) && file.staged,
  );
  const remaining = args.changes.filter(
    (file) =>
      !args.recentPaths.has(file.path) &&
      !isSensitivePath(file.path) &&
      !file.staged,
  );

  return [
    { key: 'recent', title: 'Derniere action IA', files: recent },
    { key: 'sensitive', title: 'Fichiers sensibles', files: sensitive },
    { key: 'staged', title: 'Deja staged', files: staged },
    { key: 'remaining', title: 'Reste a traiter', files: remaining },
  ].filter((section) => section.files.length > 0) as GitChangeSection[];
}

export function computeGitReadiness(args: {
  changedCount: number;
  reviewedCount: number;
  stagedCount: number;
  sensitiveCount: number;
  checklist: GitChecklistState;
  ahead: number;
  behind: number;
}) {
  let score = 0;
  const blockers: string[] = [];
  const strengths: string[] = [];

  if (args.changedCount === 0) {
    return {
      score: 100,
      label: 'draft' as GitReviewStatus,
      blockers: [],
      strengths: ['Aucun changement en attente'],
    } satisfies GitReadiness;
  }

  if (args.reviewedCount > 0) {
    score += Math.min(30, Math.round((args.reviewedCount / Math.max(args.changedCount, 1)) * 30));
    strengths.push(`${args.reviewedCount}/${args.changedCount} fichiers relus`);
  } else {
    blockers.push('Aucun fichier relu');
  }

  if (args.stagedCount > 0) {
    score += Math.min(20, Math.round((args.stagedCount / Math.max(args.changedCount, 1)) * 20));
    strengths.push(`${args.stagedCount} fichiers staged`);
  } else {
    blockers.push('Rien n’est staged');
  }

  const checklistValues = Object.values(args.checklist);
  const checklistDone = checklistValues.filter(Boolean).length;
  score += Math.round((checklistDone / checklistValues.length) * 40);
  if (checklistDone < checklistValues.length) {
    blockers.push('Checklist de validation incomplete');
  } else {
    strengths.push('Checklist complete');
  }

  if (args.sensitiveCount === 0 || args.checklist.checkedSensitiveFiles) {
    score += 10;
    if (args.sensitiveCount > 0) strengths.push('Fichiers sensibles verifies');
  } else if (args.sensitiveCount > 0) {
    blockers.push('Fichiers sensibles a verifier');
  }

  const label: GitReviewStatus =
    score >= 85 && (args.ahead > 0 || args.behind > 0)
      ? 'ready-to-merge'
      : score >= 65
        ? 'ready-to-commit'
        : score >= 35
          ? 'needs-review'
          : 'draft';

  return { score: Math.min(100, score), label, blockers, strengths } satisfies GitReadiness;
}

export function buildReviewerSummary(args: {
  changes: WorktreeFileChange[];
  sections: GitChangeSection[];
  impacts: string[];
  readiness: GitReadiness;
  baseBranch: string;
}) {
  const lines = [
    `Resume reviewer-friendly`,
    `- ${args.changes.length} fichiers modifies`,
    `- Impacts: ${args.impacts.length > 0 ? args.impacts.join(', ') : 'Code'}`,
    `- Etat: ${args.readiness.score}/100 (${args.readiness.label})`,
    `- Cible d'integration: ${args.baseBranch}`,
  ];

  if (args.sections.length > 0) {
    lines.push(`- Priorites: ${args.sections.map((section) => `${section.title} (${section.files.length})`).join(', ')}`);
  }

  return lines.join('\n');
}

export function buildSuggestedChecks(args: {
  impacts: string[];
  sensitiveCount: number;
  hasRecentFiles: boolean;
}) {
  const checks = ['Relire les extraits de diff et verifier le scope global'];
  if (args.impacts.includes('Tests')) checks.push('Executer ou completer les tests modifies');
  if (args.impacts.includes('Configuration')) checks.push('Verifier la compatibilite des fichiers de configuration');
  if (args.impacts.includes('UI')) checks.push('Verifier visuellement le parcours impacte');
  if (args.sensitiveCount > 0) checks.push('Faire une revue manuelle des fichiers sensibles');
  if (args.hasRecentFiles) checks.push('Verifier que les derniers changements de l’agent sont bien intentionnels');
  return checks;
}
