export type MentionAnchor = {
  left: number;
  bottom: number;
};

export type MentionState = {
  open: boolean;
  query: string;
  startIndex: number;
  anchor: MentionAnchor | null;
};

const INVALID_MENTION_QUERY_CHARS = /[,;:!?<>"'|]/;

export function createClosedMentionState(): MentionState {
  return {
    open: false,
    query: "",
    startIndex: -1,
    anchor: null,
  };
}

function getComposerMentionAnchor(
  textarea: HTMLTextAreaElement | null,
): MentionAnchor | null {
  if (!textarea) {
    return null;
  }

  const rect = textarea.getBoundingClientRect();
  const shellElement = textarea.closest(".composer-shell");
  const shellRect = shellElement?.getBoundingClientRect();

  return {
    left: 12,
    bottom: shellRect ? shellRect.height + 4 : rect.height + 12,
  };
}

export function resolveFileMentionState(
  value: string,
  cursorPosition: number,
  textarea: HTMLTextAreaElement | null,
): MentionState {
  const textBeforeCursor = value.slice(0, cursorPosition);
  const lastAt = textBeforeCursor.lastIndexOf("@");

  if (lastAt === -1) {
    return createClosedMentionState();
  }

  if (lastAt > 0 && !/\s/.test(textBeforeCursor[lastAt - 1])) {
    return createClosedMentionState();
  }

  const query = textBeforeCursor.slice(lastAt + 1);
  if (
    query.includes("\n") ||
    query.endsWith(" ") ||
    INVALID_MENTION_QUERY_CHARS.test(query)
  ) {
    return createClosedMentionState();
  }

  return {
    open: true,
    query,
    startIndex: lastAt,
    anchor: getComposerMentionAnchor(textarea),
  };
}

export function resolveFeatureMentionState(
  value: string,
  cursorPosition: number,
  textarea: HTMLTextAreaElement | null,
): MentionState {
  const textBeforeCursor = value.slice(0, cursorPosition);
  const lastSlash = textBeforeCursor.lastIndexOf("/");

  if (lastSlash === -1) {
    return createClosedMentionState();
  }

  const query = textBeforeCursor.slice(lastSlash + 1);
  const hasTextBeforeSlash = lastSlash > 0;
  const precededByWhitespace =
    hasTextBeforeSlash && /\s/.test(textBeforeCursor[lastSlash - 1]);
  const hasUnmatchedAt = textBeforeCursor.lastIndexOf("@") > lastSlash;

  if (!(lastSlash === 0 || (precededByWhitespace && !hasUnmatchedAt))) {
    return createClosedMentionState();
  }

  if (
    query.includes("\n") ||
    query.endsWith(" ") ||
    INVALID_MENTION_QUERY_CHARS.test(query)
  ) {
    return createClosedMentionState();
  }

  return {
    open: true,
    query,
    startIndex: lastSlash,
    anchor: getComposerMentionAnchor(textarea),
  };
}

export function replaceMentionQuery(
  message: string,
  startIndex: number,
  query: string,
  trigger: "@" | "/",
  replacement: string,
  trailingText = "",
): {
  before: string;
  after: string;
  newMessage: string;
} {
  const before = message.slice(0, startIndex);
  const after = message.slice(startIndex + 1 + query.length);

  return {
    before,
    after,
    newMessage: `${before}${trigger}${replacement}${trailingText}${after}`,
  };
}
