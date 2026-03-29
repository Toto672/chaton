import electron from "electron";
import { getDb } from "../../db/index.js";
import { findConversationById } from "../../db/repos/conversations.js";

const { ipcMain } = electron;

export function registerComposerHandlers(): void {
  ipcMain.handle(
    "composer:saveDraft",
    async (_event, key: string, content: string) => {
      try {
        const { saveComposerDraft } =
          await import("../../db/repos/conversations.js");
        saveComposerDraft(getDb(), key, content);
        return { ok: true };
      } catch (error) {
        console.error("Failed to save composer draft:", error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  ipcMain.handle("composer:getDraft", async (_event, key: string) => {
    try {
      const { getComposerDraft } = await import("../../db/repos/conversations.js");
      const draft = getComposerDraft(getDb(), key);
      return { ok: true, draft: draft?.content ?? null };
    } catch (error) {
      console.error("Failed to get composer draft:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("composer:getAllDrafts", async () => {
    try {
      const { getComposerDrafts } =
        await import("../../db/repos/conversations.js");
      const drafts = getComposerDrafts(getDb());
      const result: Record<string, string> = {};
      for (const draft of drafts) {
        result[draft.key] = draft.content;
      }
      return { ok: true, drafts: result };
    } catch (error) {
      console.error("Failed to get all composer drafts:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("composer:deleteDraft", async (_event, key: string) => {
    try {
      const { deleteComposerDraft } =
        await import("../../db/repos/conversations.js");
      deleteComposerDraft(getDb(), key);
      return { ok: true };
    } catch (error) {
      console.error("Failed to delete composer draft:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle(
    "composer:saveQueuedMessages",
    async (_event, key: string, messages: string[]) => {
      try {
        const { saveComposerQueuedMessages } =
          await import("../../db/repos/conversations.js");
        saveComposerQueuedMessages(getDb(), key, messages);
        return { ok: true };
      } catch (error) {
        console.error("Failed to save queued composer messages:", error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  ipcMain.handle("composer:getQueuedMessages", async (_event, key: string) => {
    try {
      const { getComposerQueuedMessages } =
        await import("../../db/repos/conversations.js");
      const queued = getComposerQueuedMessages(getDb(), key);
      return {
        ok: true,
        messages: queued ? JSON.parse(queued.messages_json) : [],
      };
    } catch (error) {
      console.error("Failed to get queued composer messages:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("composer:getAllQueuedMessages", async () => {
    try {
      const { getAllComposerQueuedMessages } =
        await import("../../db/repos/conversations.js");
      const queuedEntries = getAllComposerQueuedMessages(getDb());
      const result: Record<string, string[]> = {};
      for (const entry of queuedEntries) {
        result[entry.key] = JSON.parse(entry.messages_json);
      }
      return { ok: true, queuedMessages: result };
    } catch (error) {
      console.error("Failed to get all queued composer messages:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("composer:deleteQueuedMessages", async (_event, key: string) => {
    try {
      const { deleteComposerQueuedMessages } =
        await import("../../db/repos/conversations.js");
      deleteComposerQueuedMessages(getDb(), key);
      return { ok: true };
    } catch (error) {
      console.error("Failed to delete queued composer messages:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle(
    "setConversationMemoryInjected",
    async (_event, conversationId: string, injected: boolean) => {
      try {
        const db = getDb();
        db.prepare(
          `UPDATE conversations SET memory_injected = ? WHERE id = ?`
        ).run(injected ? 1 : 0, conversationId);

        const conversation = findConversationById(db, conversationId);
        if (conversation) {
          conversation.memory_injected = injected ? 1 : 0;
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to set conversation memory injected:", error);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );
}
