import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/workspace/store";

function StatusButton({
  label,
  warning = false,
}: {
  label: string;
  warning?: boolean;
}) {
  return (
    <button
      type="button"
      className={`status-button ${warning ? "status-button-warning" : ""}`}
    >
      <span>{label}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

export function Composer() {
  const { state, createConversationForProject, setNotice } = useWorkspace();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedConversation = state.conversations.find(
    (conversation) => conversation.id === state.selectedConversationId,
  );
  const isDraftConversation =
    state.selectedProjectId !== null && !selectedConversation;

  const handleSendMessage = async () => {
    const nextMessage = message.trim();
    if (!nextMessage) {
      return;
    }

    if (selectedConversation) {
      setNotice("Envoi de message non implémenté pour les fils existants.");
      return;
    }

    if (!state.selectedProjectId) {
      setNotice("Sélectionnez un projet pour démarrer un fil.");
      return;
    }

    const createdConversation = await createConversationForProject(
      state.selectedProjectId,
    );
    if (!createdConversation) {
      return;
    }

    setMessage("");
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSendMessage();
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const computedStyles = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyles.lineHeight) || 20;
    const maxHeight = lineHeight * 4;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [message]);

  return (
    <footer className="composer-footer">
      <div className="content-wrap">
        {state.notice ? (
          <div
            className="app-notice"
            role="status"
            onClick={() => setNotice(null)}
          >
            {state.notice}
          </div>
        ) : null}

        <div className="composer-shell">
          <textarea
            ref={textareaRef}
            placeholder={
              selectedConversation
                ? `Répondre dans « ${selectedConversation.title} »`
                : isDraftConversation
                  ? "Écrivez votre premier message pour créer ce fil"
                  : "Sélectionnez un fil pour commencer"
            }
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            className="composer-input"
            rows={1}
          />

          <div className="composer-meta">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-[#696b73]"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="meta-chip">
                GPT-5.3-Codex <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Badge>
            </div>
          </div>
        </div>

        <div className="status-row">
          {/* <StatusButton label="▭ Local" /> */}
          {/* <StatusButton label="◌ Accès complet" warning /> */}
          <StatusButton label="⌘ main" />
        </div>
      </div>
    </footer>
  );
}
