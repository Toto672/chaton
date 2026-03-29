import { useCallback, useState, type ChangeEvent, type RefObject } from "react";

import {
  createClosedMentionState,
  replaceMentionQuery,
  resolveFeatureMentionState,
  resolveFileMentionState,
  type MentionAnchor,
} from "./mention-utils";

type FileMentionResult = { path: string };
type FeatureMentionResult = { type: "skill"; source: string; title: string };

type UseComposerMentionsArgs = {
  message: string;
  setMessage: (next: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onAutocompleteRequest: (value: string, cursorPosition: number) => void;
  onAutocompleteClear: () => void;
  isAutocompleteAvailable: boolean;
};

type UseComposerMentionsResult = {
  fileMentionOpen: boolean;
  fileMentionQuery: string;
  fileMentionAnchor: MentionAnchor | null;
  featureMentionOpen: boolean;
  featureMentionQuery: string;
  featureMentionAnchor: MentionAnchor | null;
  autocompleteOpen: boolean;
  setAutocompleteOpen: (open: boolean) => void;
  handleComposerChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleFileMentionSelect: (result: FileMentionResult) => void;
  handleFileMentionClose: () => void;
  handleFeatureMentionSelect: (result: FeatureMentionResult) => void;
  handleFeatureMentionClose: () => void;
};

export function useComposerMentions({
  message,
  setMessage,
  textareaRef,
  onAutocompleteRequest,
  onAutocompleteClear,
  isAutocompleteAvailable,
}: UseComposerMentionsArgs): UseComposerMentionsResult {
  const [fileMentionState, setFileMentionState] = useState(createClosedMentionState);
  const [featureMentionState, setFeatureMentionState] = useState(createClosedMentionState);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  const handleComposerChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      const cursorPosition = event.target.selectionStart;
      const textarea = textareaRef.current;

      setMessage(value);

      const nextFileMentionState = resolveFileMentionState(
        value,
        cursorPosition,
        textarea,
      );
      const nextFeatureMentionState = resolveFeatureMentionState(
        value,
        cursorPosition,
        textarea,
      );

      setFileMentionState(nextFileMentionState);
      setFeatureMentionState(nextFeatureMentionState);

      if (
        !nextFileMentionState.open &&
        !nextFeatureMentionState.open &&
        isAutocompleteAvailable
      ) {
        onAutocompleteRequest(value, cursorPosition);
        setAutocompleteOpen(true);
      } else {
        onAutocompleteClear();
        setAutocompleteOpen(false);
      }
    },
    [
      isAutocompleteAvailable,
      onAutocompleteClear,
      onAutocompleteRequest,
      setMessage,
      textareaRef,
    ],
  );

  const resetFileMention = useCallback(() => {
    setFileMentionState(createClosedMentionState());
  }, []);

  const resetFeatureMention = useCallback(() => {
    setFeatureMentionState(createClosedMentionState());
  }, []);

  const handleFileMentionSelect = useCallback(
    (result: FileMentionResult) => {
      const replacement = replaceMentionQuery(
        message,
        fileMentionState.startIndex,
        fileMentionState.query,
        "@",
        result.path,
        " ",
      );

      setMessage(replacement.newMessage);
      resetFileMention();

      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }
        const newCursorPosition = replacement.before.length + 1 + result.path.length + 1;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      });
    },
    [fileMentionState.query, fileMentionState.startIndex, message, resetFileMention, setMessage, textareaRef],
  );

  const handleFeatureMentionSelect = useCallback(
    (result: FeatureMentionResult) => {
      const replacement = replaceMentionQuery(
        message,
        featureMentionState.startIndex,
        featureMentionState.query,
        "/",
        result.title,
      );

      setMessage(replacement.newMessage);
      resetFeatureMention();

      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }
        const newCursorPosition = replacement.before.length + 1 + result.title.length + 1;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      });
    },
    [featureMentionState.query, featureMentionState.startIndex, message, resetFeatureMention, setMessage, textareaRef],
  );

  return {
    fileMentionOpen: fileMentionState.open,
    fileMentionQuery: fileMentionState.query,
    fileMentionAnchor: fileMentionState.anchor,
    featureMentionOpen: featureMentionState.open,
    featureMentionQuery: featureMentionState.query,
    featureMentionAnchor: featureMentionState.anchor,
    autocompleteOpen,
    setAutocompleteOpen,
    handleComposerChange,
    handleFileMentionSelect,
    handleFileMentionClose: resetFileMention,
    handleFeatureMentionSelect,
    handleFeatureMentionClose: resetFeatureMention,
  };
}
