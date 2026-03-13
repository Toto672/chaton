import { useEffect, useMemo, useState } from "react";

import { workspaceIpc } from "@/services/ipc/workspace";
import type { WorkspaceContextValue as WorkspaceStore } from "@/features/workspace/store/context";
import { usePiRuntime } from "@/features/workspace/store/pi-store";
import type {
  ConversationTouchedFile,
  GitChecklistState,
  GitFileDiffPreview,
  GitViewMode,
  ProjectFileChange,
  WorktreeFileChange,
  WorktreeInfo,
} from "./topbarGitTypes";
import {
  buildGitSections,
  buildReviewerSummary,
  buildSuggestedChecks,
  computeGitReadiness,
  computeReviewStatus,
  dedupeTouchedFiles,
  extractFileChangesFromMessages,
  extractRecentConversationDiffContext,
  inferImpactLabel,
  isSensitivePath,
  makeChecklistStorageKey,
  makeReviewStorageKey,
} from "./topbarGitUtils";

type UseTopbarGitReviewArgs = {
  setNotice: WorkspaceStore['setNotice'];
  getWorktreeGitInfo: WorkspaceStore['getWorktreeGitInfo'];
  generateWorktreeCommitMessage: WorkspaceStore['generateWorktreeCommitMessage'];
  commitWorktree: WorkspaceStore['commitWorktree'];
  mergeWorktreeIntoMain: WorkspaceStore['mergeWorktreeIntoMain'];
  pushWorktreeBranch: WorkspaceStore['pushWorktreeBranch'];
  enableConversationWorktree: WorkspaceStore['enableConversationWorktree'];
  disableConversationWorktree: WorkspaceStore['disableConversationWorktree'];
  sendPiPrompt: WorkspaceStore['sendPiPrompt'];
  selectedConversation: WorkspaceStore['state']['conversations'][number] | undefined;
  hasWorktree: boolean;
  t: (value: string) => string;
};

function inferProjectFileStatus(file: Pick<ProjectFileChange, 'added' | 'removed'>): ProjectFileChange['status'] {
  if (file.added > 0 && file.removed === 0) return 'added';
  if (file.removed > 0 && file.added === 0) return 'deleted';
  return 'modified';
}

const emptyChecklist: GitChecklistState = {
  reviewedFiles: false,
  checkedSensitiveFiles: false,
  validatedScope: false,
  commitMessageReady: false,
};

export function useTopbarGitReview(args: UseTopbarGitReviewArgs) {
  const {
    setNotice,
    getWorktreeGitInfo,
    generateWorktreeCommitMessage,
    commitWorktree,
    mergeWorktreeIntoMain,
    pushWorktreeBranch,
    enableConversationWorktree,
    disableConversationWorktree,
    sendPiPrompt,
    selectedConversation,
    hasWorktree,
    t,
  } = args;

  const runtime = usePiRuntime(selectedConversation?.id ?? null);

  const [isWorktreeDialogOpen, setIsWorktreeDialogOpen] = useState(false);
  const [worktreeInfo, setWorktreeInfo] = useState<WorktreeInfo | null>(null);
  const [projectGitInfo, setProjectGitInfo] = useState<ProjectFileChange[] | null>(null);
  const [isLoadingWorktreeInfo, setIsLoadingWorktreeInfo] = useState(false);
  const [isLoadingProjectGitInfo, setIsLoadingProjectGitInfo] = useState(false);
  const [isGeneratingCommitMessage, setIsGeneratingCommitMessage] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isEnablingWorktree, setIsEnablingWorktree] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [gitViewMode, setGitViewMode] = useState<GitViewMode>('tree');
  const [stageBusyPath, setStageBusyPath] = useState<string | null>(null);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string | null>(null);
  const [diffPreview, setDiffPreview] = useState<GitFileDiffPreview | null>(null);
  const [isLoadingDiffPreview, setIsLoadingDiffPreview] = useState(false);
  const [reviewedPaths, setReviewedPaths] = useState<Record<string, boolean>>({});
  const [gitChecklist, setGitChecklist] = useState<GitChecklistState>(emptyChecklist);
  const [isSendingGitPrompt, setIsSendingGitPrompt] = useState(false);
  const [conversationTouchedFiles, setConversationTouchedFiles] = useState<ConversationTouchedFile[]>([]);
  const [isBatchStaging, setIsBatchStaging] = useState(false);
  const [isRefreshingContext, setIsRefreshingContext] = useState(false);

  useEffect(() => {
    setWorktreeInfo(null);
    setCommitMessage('');
    setSelectedDiffPath(null);
    setDiffPreview(null);
    setReviewedPaths({});
    setGitChecklist(emptyChecklist);
    setConversationTouchedFiles([]);
  }, [hasWorktree, selectedConversation?.id]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    try {
      const raw = window.localStorage.getItem(makeReviewStorageKey(selectedConversation.id));
      setReviewedPaths(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});

      const rawChecklist = window.localStorage.getItem(makeChecklistStorageKey(selectedConversation.id));
      setGitChecklist(rawChecklist ? (JSON.parse(rawChecklist) as GitChecklistState) : emptyChecklist);
    } catch {
      setReviewedPaths({});
      setGitChecklist(emptyChecklist);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    window.localStorage.setItem(makeReviewStorageKey(selectedConversation.id), JSON.stringify(reviewedPaths));
    window.localStorage.setItem(makeChecklistStorageKey(selectedConversation.id), JSON.stringify(gitChecklist));
  }, [reviewedPaths, gitChecklist, selectedConversation?.id]);

  const refreshWorktreeInfo = async () => {
    if (!selectedConversation?.id) return;
    setIsLoadingWorktreeInfo(true);
    try {
      const result = await getWorktreeGitInfo(selectedConversation.id);
      if (!result.ok) {
        setNotice(result.message ?? 'Impossible de charger les infos du worktree.');
        return;
      }
      const nextInfo: WorktreeInfo = result;
      setWorktreeInfo(nextInfo);
      setExpandedFolders((current) => {
        const next = { ...current };
        for (const file of nextInfo.changes) {
          const parts = file.path.split('/').filter(Boolean);
          let currentPath = '';
          parts.slice(0, -1).forEach((part) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!(currentPath in next)) next[currentPath] = true;
          });
        }
        return next;
      });
    } finally {
      setIsLoadingWorktreeInfo(false);
    }
  };

  const refreshProjectGitInfo = async () => {
    if (!selectedConversation?.id) return;
    setIsLoadingProjectGitInfo(true);
    try {
      const result = await workspaceIpc.getGitDiffSummary(selectedConversation.id);
      if (!result.ok) {
        setNotice(result.message ?? 'Impossible de charger les infos Git du projet.');
        setProjectGitInfo([]);
        return;
      }
      const changes: ProjectFileChange[] = result.files.map((file) => ({
        path: file.path,
        added: file.added,
        removed: file.removed,
        status: inferProjectFileStatus(file),
      }));
      setProjectGitInfo(changes);
      setExpandedFolders((current) => {
        const next = { ...current };
        for (const file of changes) {
          const parts = file.path.split('/').filter(Boolean);
          let currentPath = '';
          parts.slice(0, -1).forEach((part) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!(currentPath in next)) next[currentPath] = true;
          });
        }
        return next;
      });
    } finally {
      setIsLoadingProjectGitInfo(false);
    }
  };

  const refreshConversationContext = async () => {
    if (!selectedConversation?.id) return;
    setIsRefreshingContext(true);
    try {
      const messages = Array.isArray(runtime?.messages) ? runtime.messages : [];
      setConversationTouchedFiles(dedupeTouchedFiles(extractFileChangesFromMessages(messages)));
    } finally {
      setIsRefreshingContext(false);
    }
  };

  const loadDiffPreview = async (filePath: string) => {
    if (!selectedConversation?.id) return;
    setSelectedDiffPath(filePath);
    setIsLoadingDiffPreview(true);
    try {
      const result = await workspaceIpc.getGitFileDiff(selectedConversation.id, filePath);
      if (!result.ok) {
        setNotice(result.message ?? t('Impossible de lire le diff du fichier.'));
        setDiffPreview(null);
        return;
      }
      setDiffPreview(result);
      setReviewedPaths((current) => ({ ...current, [filePath]: true }));
    } finally {
      setIsLoadingDiffPreview(false);
    }
  };

  const openWorktreeDialog = async () => {
    if (!selectedConversation?.id) return;
    setIsWorktreeDialogOpen(true);
    await refreshConversationContext();
    if (hasWorktree) await refreshWorktreeInfo();
    else await refreshProjectGitInfo();
  };

  const closeWorktreeDialog = () => setIsWorktreeDialogOpen(false);

  const handleWorktreeToggleClick = async () => {
    if (!selectedConversation?.id || isEnablingWorktree) return;
    if (hasWorktree) {
      setIsEnablingWorktree(true);
      try {
        const result = await disableConversationWorktree(selectedConversation.id);
        if (!result.ok) {
          setNotice(result.reason === 'has_uncommitted_changes' ? t('Impossible de désactiver: modifications non commitées.') : t('Impossible de désactiver le worktree.'));
          return;
        }
        setIsWorktreeDialogOpen(false);
        setWorktreeInfo(null);
        setCommitMessage('');
        setNotice(t('Worktree désactivé.'));
      } finally {
        setIsEnablingWorktree(false);
      }
      return;
    }

    setIsEnablingWorktree(true);
    try {
      const updatedConversation = await enableConversationWorktree(selectedConversation.id);
      if (!updatedConversation?.worktreePath) return;
      setNotice(t('Worktree activé.'));
      setIsWorktreeDialogOpen(true);
      await refreshWorktreeInfo();
    } finally {
      setIsEnablingWorktree(false);
    }
  };

  const handleGenerateCommitMessage = async () => {
    if (!selectedConversation?.id) return;
    setIsGeneratingCommitMessage(true);
    try {
      const result = await generateWorktreeCommitMessage(selectedConversation.id);
      if (!result.ok) {
        setNotice(result.reason === 'no_changes' ? t('Aucune modification à commit.') : result.message ?? t('Impossible de générer un message de commit.'));
        return;
      }
      setCommitMessage(result.message);
    } finally {
      setIsGeneratingCommitMessage(false);
    }
  };

  const handleToggleStage = async (file: WorktreeFileChange) => {
    if (!selectedConversation?.id || stageBusyPath) return;
    setStageBusyPath(file.path);
    try {
      const result = file.staged
        ? await workspaceIpc.unstageWorktreeFile(selectedConversation.id, file.path)
        : await workspaceIpc.stageWorktreeFile(selectedConversation.id, file.path);
      if (!result.ok) {
        setNotice(result.message ?? t('Impossible de mettre à jour le staging.'));
        return;
      }
      await refreshWorktreeInfo();
    } finally {
      setStageBusyPath(null);
    }
  };

  const stageFiles = async (files: WorktreeFileChange[], mode: 'stage' | 'unstage') => {
    if (!selectedConversation?.id || files.length === 0 || isBatchStaging) return;
    setIsBatchStaging(true);
    try {
      for (const file of files) {
        const result = mode === 'stage'
          ? await workspaceIpc.stageWorktreeFile(selectedConversation.id, file.path)
          : await workspaceIpc.unstageWorktreeFile(selectedConversation.id, file.path);
        if (!result.ok) {
          setNotice(result.message ?? t('Impossible de mettre à jour le staging.'));
          break;
        }
      }
      await refreshWorktreeInfo();
    } finally {
      setIsBatchStaging(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedConversation?.id || isCommitting) return;
    setIsCommitting(true);
    try {
      const result = await commitWorktree(selectedConversation.id, commitMessage);
      if (!result.ok) {
        setNotice(result.reason === 'empty_message' ? t('Message de commit requis.') : result.reason === 'no_changes' ? t('Aucune modification à commit.') : result.message ?? t('Commit impossible.'));
        return;
      }
      setNotice(`Commit créé: ${result.commit}`);
      setCommitMessage('');
      await refreshWorktreeInfo();
    } finally {
      setIsCommitting(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedConversation?.id || isMerging) return;
    setIsMerging(true);
    try {
      const result = await mergeWorktreeIntoMain(selectedConversation.id);
      if (!result.ok) {
        setNotice(result.reason === 'already_merged' ? 'La branche est déjà mergée dans main.' : result.reason === 'merge_conflicts' ? 'Merge impossible: des conflits de merge doivent être résolus.' : result.message ?? 'Merge impossible.');
        return;
      }
      setNotice(result.message);
      await refreshWorktreeInfo();
    } finally {
      setIsMerging(false);
    }
  };

  const handlePush = async () => {
    if (!selectedConversation?.id || isPushing) return;
    setIsPushing(true);
    try {
      const result = await pushWorktreeBranch(selectedConversation.id);
      if (!result.ok) {
        setNotice(result.message ?? 'Push impossible.');
        return;
      }
      setNotice(`Push effectué: ${result.remote}/${result.branch}`);
      await refreshWorktreeInfo();
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (!selectedConversation?.id || isPulling) return;
    setIsPulling(true);
    try {
      const result = await workspaceIpc.pullWorktreeBranch(selectedConversation.id);
      if (!result.ok) {
        setNotice(result.message ?? 'Pull impossible.');
        return;
      }
      setNotice(`Pull effectué: ${result.remote}/${result.branch}`);
      await refreshWorktreeInfo();
    } finally {
      setIsPulling(false);
    }
  };

  const sendGitFollowUpPrompt = async (kind: 'explain' | 'reduce' | 'tests' | 'fix-file') => {
    if (!selectedConversation?.id || isSendingGitPrompt) return;
    const messages = Array.isArray(runtime?.messages) ? runtime.messages : [];
    const recentFiles = extractRecentConversationDiffContext(messages);
    const focusFile = selectedDiffPath ?? worktreeInfo?.changes[0]?.path ?? null;

    const promptByKind: Record<typeof kind, string> = {
      explain: `Explique les changements Git de cette conversation. Concentre-toi sur les fichiers suivants: ${recentFiles.join(', ') || 'aucun fichier detecte'}. Donne un resume reviewer-friendly, les risques, et ce qu'il faut verifier.`,
      reduce: `Le diff semble trop large. Propose une reduction du diff et limite-toi aux changements strictement necessaires. Concentre-toi sur ${focusFile ?? 'les fichiers modifies'}.`,
      tests: `Analyse les changements recents et ajoute ou propose les tests manquants. Fichiers concernes: ${recentFiles.join(', ') || 'aucun fichier detecte'}.`,
      'fix-file': `Revois et corrige uniquement le fichier ${focusFile ?? 'selectionne'}. Si le fichier n'est pas selectionne, demande-moi lequel cibler.`,
    };

    setIsSendingGitPrompt(true);
    try {
      await sendPiPrompt({ conversationId: selectedConversation.id, message: promptByKind[kind] });
      setNotice(t('Demande envoyee a l\'agent.'));
    } finally {
      setIsSendingGitPrompt(false);
    }
  };

  const stagedCount = worktreeInfo?.changes.filter((file) => file.staged).length ?? 0;
  const changedCount = worktreeInfo?.changes.length ?? 0;
  const reviewedCount = worktreeInfo?.changes.filter((file) => reviewedPaths[file.path]).length ?? 0;
  const lastAgentTouchedSet = useMemo(() => new Set(conversationTouchedFiles.map((file) => file.path)), [conversationTouchedFiles]);
  const sensitiveFiles = useMemo(() => (worktreeInfo?.changes ?? []).filter((file) => isSensitivePath(file.path)), [worktreeInfo?.changes]);
  const impactSummary = useMemo(() => {
    const labels = new Set<string>();
    (worktreeInfo?.changes ?? []).forEach((file) => labels.add(inferImpactLabel(file.path)));
    return Array.from(labels);
  }, [worktreeInfo?.changes]);
  const groupedChanges = useMemo(() => {
    const changes = worktreeInfo?.changes ?? [];
    return {
      recent: changes.filter((file) => lastAgentTouchedSet.has(file.path)),
      sensitive: changes.filter((file) => isSensitivePath(file.path)),
      staged: changes.filter((file) => file.staged),
      remaining: changes.filter((file) => !lastAgentTouchedSet.has(file.path) && !isSensitivePath(file.path) && !file.staged),
    };
  }, [lastAgentTouchedSet, worktreeInfo?.changes]);
  const gitSections = useMemo(() => buildGitSections({ changes: worktreeInfo?.changes ?? [], recentPaths: lastAgentTouchedSet }), [lastAgentTouchedSet, worktreeInfo?.changes]);
  const totalAddedRemoved = useMemo(() => conversationTouchedFiles.reduce((acc, file) => ({ added: acc.added + file.added, removed: acc.removed + file.removed }), { added: 0, removed: 0 }), [conversationTouchedFiles]);
  const reviewStatus = computeReviewStatus({
    hasChanges: Boolean(worktreeInfo?.hasChanges),
    changedCount,
    reviewedCount,
    stagedCount,
    hasUnstaged: Boolean(worktreeInfo?.changes.some((file) => !file.staged)),
    ahead: worktreeInfo?.ahead ?? 0,
    behind: worktreeInfo?.behind ?? 0,
  });
  const readiness = useMemo(() => computeGitReadiness({ changedCount, reviewedCount, stagedCount, sensitiveCount: sensitiveFiles.length, checklist: gitChecklist, ahead: worktreeInfo?.ahead ?? 0, behind: worktreeInfo?.behind ?? 0 }), [changedCount, reviewedCount, stagedCount, sensitiveFiles.length, gitChecklist, worktreeInfo?.ahead, worktreeInfo?.behind]);
  const reviewerSummary = useMemo(() => buildReviewerSummary({ changes: worktreeInfo?.changes ?? [], sections: gitSections, impacts: impactSummary, readiness, baseBranch: worktreeInfo?.baseBranch ?? 'main' }), [gitSections, impactSummary, readiness, worktreeInfo?.baseBranch, worktreeInfo?.changes]);
  const suggestedChecks = useMemo(() => buildSuggestedChecks({ impacts: impactSummary, sensitiveCount: sensitiveFiles.length, hasRecentFiles: groupedChanges.recent.length > 0 }), [groupedChanges.recent.length, impactSummary, sensitiveFiles.length]);

  return {
    isWorktreeDialogOpen,
    setIsWorktreeDialogOpen,
    worktreeInfo,
    projectGitInfo,
    isLoadingWorktreeInfo,
    isLoadingProjectGitInfo,
    isGeneratingCommitMessage,
    commitMessage,
    setCommitMessage,
    isCommitting,
    isMerging,
    isPushing,
    isPulling,
    isEnablingWorktree,
    expandedFolders,
    setExpandedFolders,
    gitViewMode,
    setGitViewMode,
    selectedDiffPath,
    diffPreview,
    isLoadingDiffPreview,
    reviewedPaths,
    gitChecklist,
    setGitChecklist,
    isSendingGitPrompt,
    isBatchStaging,
    isRefreshingContext,
    conversationTouchedFiles,
    refreshConversationContext,
    openWorktreeDialog,
    closeWorktreeDialog,
    handleWorktreeToggleClick,
    handleGenerateCommitMessage,
    handleToggleStage,
    stageFiles,
    handleCommit,
    handleMerge,
    handlePush,
    handlePull,
    loadDiffPreview,
    sendGitFollowUpPrompt,
    projectTree: projectGitInfo,
    stagedCount,
    changedCount,
    reviewedCount,
    lastAgentTouchedSet,
    sensitiveFiles,
    impactSummary,
    groupedChanges,
    gitSections,
    totalAddedRemoved,
    reviewStatus,
    readiness,
    reviewerSummary,
    suggestedChecks,
  };
}
