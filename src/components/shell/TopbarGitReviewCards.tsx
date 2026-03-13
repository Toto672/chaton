import { AlertTriangle, Check, FileWarning, RefreshCw, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import type {
  GitChecklistState,
  GitFileDiffPreview,
  GitReadiness,
  GitReviewStatus,
  WorktreeFileChange,
  WorktreeInfo,
} from "./topbarGitTypes";

type GitChecklistProps = {
  checklist: GitChecklistState;
  onToggle: (key: keyof GitChecklistState) => void;
  t: (value: string) => string;
};

export function GitChecklist({ checklist, onToggle, t }: GitChecklistProps) {
  const items: Array<{ key: keyof GitChecklistState; label: string }> = [
    { key: 'reviewedFiles', label: 'J’ai relu les fichiers modifies' },
    { key: 'checkedSensitiveFiles', label: 'J’ai verifie les fichiers sensibles' },
    { key: 'validatedScope', label: 'Le scope du diff est coherent' },
    { key: 'commitMessageReady', label: 'Le message de commit est pret' },
  ];

  return (
    <div className="git-info-message" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('Checklist de validation')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <label key={item.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={checklist[item.key]} onChange={() => onToggle(item.key)} />
            <span>{t(item.label)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

type GitReviewSummaryCardProps = {
  readiness: GitReadiness;
  reviewerSummary: string;
  suggestedChecks: string[];
  reviewStatusLabel: (status: GitReviewStatus, t: (value: string) => string) => string;
  t: (value: string) => string;
};

export function GitReviewSummaryCard({ readiness, reviewerSummary, suggestedChecks, reviewStatusLabel, t }: GitReviewSummaryCardProps) {
  return (
    <div className="git-section-card git-section-card-tight">
      <div className="git-section-header">
        <div className="git-section-title">{t('PR summary')}</div>
        <span className="git-section-caption">{readiness.score}/100</span>
      </div>
      <div className="git-info-message" style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
        {reviewerSummary}
      </div>
      <div className="git-inline-meta" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <span className="git-summary-pill">{reviewStatusLabel(readiness.label, t)}</span>
        {readiness.strengths.map((item) => (
          <span key={item} className="git-summary-pill">{t(item)}</span>
        ))}
      </div>
      {readiness.blockers.length > 0 ? (
        <div className="git-info-message" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('Blocages')}</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {readiness.blockers.map((item) => (
              <li key={item}>{t(item)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="git-info-message" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('Verifications suggerees')}</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {suggestedChecks.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type GitDetailedReviewCardProps = {
  selectedDiffPath: string | null;
  isLoadingDiffPreview: boolean;
  diffPreview: GitFileDiffPreview | null;
  reviewedPaths: Record<string, boolean>;
  inferImpactLabel: (path: string) => string;
  summarizeDiffExcerpt: (diff: string) => string[];
  t: (value: string) => string;
};

export function GitDetailedReviewCard(props: GitDetailedReviewCardProps) {
  const { selectedDiffPath, isLoadingDiffPreview, diffPreview, reviewedPaths, inferImpactLabel, summarizeDiffExcerpt, t } = props;

  return (
    <div className="git-section-card git-section-card-tight">
      <div className="git-section-header">
        <div className="git-section-title">{t('Revue detaillee')}</div>
        {selectedDiffPath ? <span className="git-section-caption">{selectedDiffPath}</span> : null}
      </div>
      {selectedDiffPath ? (
        isLoadingDiffPreview ? (
          <div className="queue-panel-row">{t('Chargement...')}</div>
        ) : diffPreview ? (
          diffPreview.isBinary ? (
            <div className="git-info-message">{t("Diff binaire indisponible dans l'aperçu.")}</div>
          ) : (
            <>
              <div className="git-inline-meta" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
                <span className="git-summary-pill">{reviewedPaths[selectedDiffPath] ? t('Relu') : t('A relire')}</span>
                <span className="git-summary-pill">{t(inferImpactLabel(selectedDiffPath))}</span>
                {diffPreview.firstChangedLine !== null ? <span className="git-summary-pill">{t('Premiere ligne')}: {diffPreview.firstChangedLine}</span> : null}
              </div>
              <div className="git-info-message" style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                {summarizeDiffExcerpt(diffPreview.diff).length > 0 ? summarizeDiffExcerpt(diffPreview.diff).join('\n') : t('Aucun extrait disponible.')}
              </div>
              <pre className="git-diff-preview" style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflow: 'auto', fontSize: 12 }}>{diffPreview.diff}</pre>
            </>
          )
        ) : (
          <div className="git-info-message">{t('Selectionne un fichier pour commencer la revue.')}</div>
        )
      ) : (
        <div className="git-info-message">{t('Selectionne un fichier pour commencer la revue.')}</div>
      )}
    </div>
  );
}

type GitValidationCardProps = {
  worktreeInfo: WorktreeInfo;
  reviewStatus: GitReviewStatus;
  reviewStatusLabel: (status: GitReviewStatus, t: (value: string) => string) => string;
  reviewedCount: number;
  changedCount: number;
  lastAgentTouchedCount: number;
  readiness: GitReadiness;
  isBatchStaging: boolean;
  stageFiles: (files: WorktreeFileChange[], action: 'stage' | 'unstage') => Promise<void>;
  changes: WorktreeFileChange[];
  lastAgentTouchedSet: Set<string>;
  isSensitivePath: (path: string) => boolean;
  groupedChanges: { recent: WorktreeFileChange[]; sensitive: WorktreeFileChange[]; remaining: WorktreeFileChange[] };
  sensitiveFilesCount: number;
  gitChecklist: GitChecklistState;
  setGitChecklist: Dispatch<SetStateAction<GitChecklistState>>;
  commitMessage: string;
  setCommitMessage: (value: string) => void;
  isCommitting: boolean;
  handleCommit: () => Promise<void>;
  isPushing: boolean;
  handlePush: () => Promise<void>;
  isPulling: boolean;
  handlePull: () => Promise<void>;
  isMerging: boolean;
  handleMerge: () => Promise<void>;
  isSendingGitPrompt: boolean;
  sendGitFollowUpPrompt: (kind: 'explain' | 'reduce' | 'tests' | 'fix-file') => Promise<void>;
  t: (value: string) => string;
};

export function GitValidationCard(props: GitValidationCardProps) {
  const {
    worktreeInfo,
    reviewStatus,
    reviewStatusLabel,
    reviewedCount,
    changedCount,
    lastAgentTouchedCount,
    readiness,
    isBatchStaging,
    stageFiles,
    changes,
    lastAgentTouchedSet,
    isSensitivePath,
    groupedChanges,
    sensitiveFilesCount,
    gitChecklist,
    setGitChecklist,
    commitMessage,
    setCommitMessage,
    isCommitting,
    handleCommit,
    isPushing,
    handlePush,
    isPulling,
    handlePull,
    isMerging,
    handleMerge,
    isSendingGitPrompt,
    sendGitFollowUpPrompt,
    t,
  } = props;

  return (
    <div className="git-section-card git-section-card-tight">
      <div className="git-section-header">
        <div className="git-section-title">{t('Validation')}</div>
        <div className="git-commit-meta git-inline-meta">
          <span>{t('En avance')}: <strong>{worktreeInfo?.ahead ?? 0}</strong></span>
          <span>{t('En retard')}: <strong>{worktreeInfo?.behind ?? 0}</strong></span>
        </div>
      </div>
      <div className="git-info-message">
        <div className="git-inline-meta" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span>{reviewStatusLabel(reviewStatus, t)}</span>
          <span>{reviewedCount}/{changedCount} {t('fichiers relus')}</span>
          <span>{lastAgentTouchedCount} {t('fichiers issus de la conversation')}</span>
          <span>{t('Readiness')}: {readiness.score}/100</span>
        </div>
      </div>
      <div className="git-sync-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Button type="button" variant="outline" size="sm" disabled={isBatchStaging} onClick={() => stageFiles(changes.filter((file) => !file.staged), 'stage')}>
          <Check className="h-4 w-4" />
          {t('Stage all')}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isBatchStaging} onClick={() => stageFiles(changes.filter((file) => file.staged), 'unstage')}>
          <RefreshCw className="h-4 w-4" />
          {t('Unstage all')}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isBatchStaging || lastAgentTouchedSet.size === 0} onClick={() => stageFiles(changes.filter((file) => !file.staged && lastAgentTouchedSet.has(file.path)), 'stage')}>
          <Sparkles className="h-4 w-4" />
          {t('Stage derniere action IA')}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isBatchStaging} onClick={() => stageFiles(changes.filter((file) => !file.staged && !isSensitivePath(file.path)), 'stage')}>
          <FileWarning className="h-4 w-4" />
          {t('Stage non sensibles')}
        </Button>
      </div>
      <div className="git-info-message" style={{ marginBottom: 12 }}>
        <div>{reviewedCount === changedCount ? t('Tous les fichiers ont ete relus.') : t('Relis les fichiers avant de valider.')}</div>
        <div style={{ marginTop: 6 }}>{t('Priorites')}: {groupedChanges.recent.length} {t('recents')}, {groupedChanges.sensitive.length} {t('sensibles')}, {groupedChanges.remaining.length} {t('restants')}</div>
        {sensitiveFilesCount > 0 ? (
          <div style={{ marginTop: 6 }}>
            <AlertTriangle className="h-4 w-4" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'text-bottom' }} />
            {t('Des fichiers sensibles ont ete detectes: verifie-les en priorite.')}
          </div>
        ) : null}
      </div>
      <GitChecklist
        checklist={gitChecklist}
        onToggle={(key) =>
          setGitChecklist((current) => ({
            ...current,
            [key]: !current[key],
          }))
        }
        t={t}
      />
      <Input value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} placeholder={t('Message de commit')} style={{ marginBottom: 12 }} />
      <div className="git-sync-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Button type="button" size="sm" onClick={handleCommit} disabled={isCommitting || readiness.score < 50} title={readiness.score < 50 ? t('Relis et valide davantage avant de commit') : undefined}>
          {t('Commit')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handlePush} disabled={isPushing}>
          {t('Push')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handlePull} disabled={isPulling}>
          {t('Pull')}
        </Button>
        <Button type="button" variant="secondary" size="sm" className="git-merge-btn" onClick={handleMerge} disabled={isMerging || !worktreeInfo?.nativeGitAvailable || readiness.score < 75} title={!worktreeInfo?.nativeGitAvailable ? t('Le merge automatique requiert Git natif') : readiness.score < 75 ? t('Finalise la revue avant le merge') : undefined}>
          {t('Merge')}
        </Button>
      </div>
      <div className="git-sync-actions" style={{ flexWrap: 'wrap' }}>
        <Button type="button" variant="outline" size="sm" disabled={isSendingGitPrompt} onClick={() => void sendGitFollowUpPrompt('explain')}>
          {t('Demander une explication')}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isSendingGitPrompt} onClick={() => void sendGitFollowUpPrompt('reduce')}>
          {t('Reduire le diff')}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isSendingGitPrompt} onClick={() => void sendGitFollowUpPrompt('tests')}>
          {t('Ajouter les tests manquants')}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={isSendingGitPrompt} onClick={() => void sendGitFollowUpPrompt('fix-file')}>
          {t('Corriger seulement ce fichier')}
        </Button>
      </div>
    </div>
  );
}
