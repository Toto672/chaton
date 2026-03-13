export type WorktreeFileChange = {
  path: string;
  x: string;
  y: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  deleted: boolean;
  renamed: boolean;
};

export type GitFileDiffPreview = {
  path: string;
  diff: string;
  isBinary: boolean;
  firstChangedLine: number | null;
};

export type ConversationTouchedFile = {
  path: string;
  added: number;
  removed: number;
};

export type ProjectFileChange = {
  path: string;
  added: number;
  removed: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unmerged' | 'untracked' | 'ignored';
};

export type WorktreeInfo = {
  worktreePath: string;
  branch: string;
  baseBranch: string;
  hasChanges: boolean;
  hasStagedChanges: boolean;
  hasUncommittedChanges: boolean;
  ahead: number;
  behind: number;
  isMergedIntoBase: boolean;
  isPushedToUpstream: boolean;
  nativeGitAvailable?: boolean;
  changes: WorktreeFileChange[];
};

export type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  file?: WorktreeFileChange;
};

export type ProjectTreeNode = {
  name: string;
  path: string;
  children: ProjectTreeNode[];
  file?: ProjectFileChange;
};

export type GitViewMode = 'tree' | 'list';
export type GitReviewStatus = 'draft' | 'needs-review' | 'ready-to-commit' | 'ready-to-merge';

export type GitChecklistState = {
  reviewedFiles: boolean;
  checkedSensitiveFiles: boolean;
  validatedScope: boolean;
  commitMessageReady: boolean;
};

export type GitChangeSection = {
  key: string;
  title: string;
  files: WorktreeFileChange[];
};

export type GitReadiness = {
  score: number;
  label: GitReviewStatus;
  blockers: string[];
  strengths: string[];
};
