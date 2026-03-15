import crypto from "node:crypto";
import type { DbConversation } from "../db/repos/conversations.js";

type RpcCommand =
  | { id?: string; type: "prompt"; message: string }
  | { id?: string; type: "set_model"; provider: string; modelId: string };

type RpcResponse = {
  id?: string;
  type: "response";
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
};

type PiRuntimeManagerForTitle = {
  start: (conversationId: string) => Promise<{ ok?: boolean; error?: string } | unknown>;
  stop: (conversationId: string) => Promise<unknown>;
  sendCommand: (conversationId: string, command: RpcCommand) => Promise<RpcResponse>;
  getSnapshot: (conversationId: string) => Promise<{ messages: unknown[] }>;
};

const LONGUEUR_MAX_TITRE = 60;
const NOMBRE_MOTS_MIN_TITRE = 3;
const NOMBRE_MOTS_MAX_TITRE = 7;
export const AFFINAGE_TITRE_IA_ACTIVE = true;
const MODELES_TITRE_PREFERES = [
  "openai-codex/gpt-5.3-codex",
  "openai-codex/gpt-5.2-codex",
  "openai-codex/gpt-5.1-codex",
] as const;

// Title model preference storage key
const TITLE_MODEL_SETTINGS_KEY = "title_model";

import { getDb } from "../db/index.js";

export function getTitleModelPreference(): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get(TITLE_MODEL_SETTINGS_KEY) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setTitleModelPreference(modelKey: string | null): void {
  const db = getDb();
  const now = new Date().toISOString();
  if (modelKey) {
    db.prepare(
      `INSERT INTO app_settings(key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    ).run(TITLE_MODEL_SETTINGS_KEY, modelKey, now);
  } else {
    db.prepare("DELETE FROM app_settings WHERE key = ?").run(TITLE_MODEL_SETTINGS_KEY);
  }
}

function normaliserTitre(raw: string): string {
  return raw
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

function compterMots(texte: string): number {
  return texte.split(/\s+/).filter((mot) => mot.trim().length > 0).length;
}

function tronquerTitreParMots(texte: string, longueurMax: number): string {
  const mots = texte.split(/\s+/).filter((mot) => mot.trim().length > 0);
  let resultat = "";
  for (const mot of mots) {
    const candidat = resultat.length === 0 ? mot : `${resultat} ${mot}`;
    if (candidat.length > longueurMax) {
      break;
    }
    resultat = candidat;
  }
  return resultat.trim();
}

function sanitiserTitreStrict(raw: string): string | null {
  const normalise = normaliserTitre(raw);
  if (!normalise) {
    return null;
  }
  const tronque = tronquerTitreParMots(normalise, LONGUEUR_MAX_TITRE);
  if (!tronque) {
    return null;
  }
  const mots = compterMots(tronque);
  if (mots < NOMBRE_MOTS_MIN_TITRE || mots > NOMBRE_MOTS_MAX_TITRE) {
    return null;
  }
  return tronque;
}

export function construireTitreDeterministe(firstMessage: string): string {
  const messageNettoye = firstMessage
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\[\]{}()*_#>~|]/g, " ")
    .replace(/[^\p{L}\p{N}\s'’-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const mots = messageNettoye
    .split(/\s+/)
    .filter((mot) => mot.trim().length > 0);
  const base = mots.slice(0, NOMBRE_MOTS_MAX_TITRE).join(" ").trim();
  const titre = tronquerTitreParMots(base, LONGUEUR_MAX_TITRE);

  if (titre && compterMots(titre) >= NOMBRE_MOTS_MIN_TITRE) {
    return titre;
  }

  return "Nouvelle discussion";
}

function generateConversationTitlePrompt(firstMessage: string): string {
  return [
    "Tu génères un titre de fil de discussion.",
    "Contraintes strictes:",
    "- Répondre avec UN seul titre, sans guillemets.",
    "- 3 à 7 mots.",
    "- Maximum 60 caractères.",
    "- En français.",
    "",
    "Premier message utilisateur:",
    firstMessage,
  ].join("\n");
}

function choisirModelePourTitre(params: {
  preferredModelKey: string;
  availableModelKeys?: string[];
  fallbackModelKey?: string | null;
}): string[] {
  const disponibles = new Set(
    (params.availableModelKeys ?? []).filter(
      (item) => typeof item === "string" && item.trim().length > 0,
    ),
  );
  const candidats: string[] = [];
  const ajouter = (value: string | null | undefined) => {
    const propre = typeof value === "string" ? value.trim() : "";
    if (!propre) return;
    if (disponibles.size > 0 && !disponibles.has(propre)) return;
    if (!candidats.includes(propre)) {
      candidats.push(propre);
    }
  };

  ajouter(params.preferredModelKey);
  for (const modelKey of MODELES_TITRE_PREFERES) {
    ajouter(modelKey);
  }
  ajouter(params.fallbackModelKey ?? null);

  if (candidats.length === 0 && disponibles.size > 0) {
    for (const modelKey of disponibles) {
      candidats.push(modelKey);
      break;
    }
  }

  return candidats;
}

function parseModelKey(modelKey: string): { provider: string; modelId: string } | null {
  const slashIndex = modelKey.indexOf("/");
  if (slashIndex <= 0 || slashIndex === modelKey.length - 1) {
    return null;
  }
  return {
    provider: modelKey.slice(0, slashIndex),
    modelId: modelKey.slice(slashIndex + 1),
  };
}

function extractAssistantTextFromSnapshot(
  snapshot: { messages?: unknown[] } | null | undefined,
): string | null {
  const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i] as Record<string, unknown> | null;
    if (!message) continue;
    const role =
      (typeof message.role === "string"
        ? message.role
        : ((message.message as Record<string, unknown> | undefined)?.role as
            | string
            | undefined)) ?? "";
    if (role !== "assistant") continue;
    const content = Array.isArray(message.content)
      ? message.content
      : Array.isArray(
            (message.message as Record<string, unknown> | undefined)?.content,
          )
        ? ((message.message as Record<string, unknown> | undefined)
            ?.content as unknown[])
        : [];
    const textParts = content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const record = part as Record<string, unknown>;
        if (record.type === "text" && typeof record.text === "string") {
          return record.text;
        }
        return "";
      })
      .filter((part) => part.trim().length > 0);
    if (textParts.length > 0) {
      return textParts.join("\n\n").trim();
    }
  }
  return null;
}

export async function generateConversationTitleFromPi(params: {
  provider: string;
  modelId: string;
  repoPath: string;
  firstMessage: string;
  projectId?: string | null;
  availableModelKeys?: string[];
  fallbackModelKey?: string | null;
  piRuntimeManager: PiRuntimeManagerForTitle;
  insertConversation: (
    params: Pick<
      DbConversation,
      "id" | "project_id" | "model_provider" | "model_id" | "access_mode"
    > & {
      title: string;
      hiddenFromSidebar?: boolean;
    },
  ) => void;
  log?: (message: string, details?: Record<string, unknown>) => void;
}): Promise<string | null> {
  const prompt = generateConversationTitlePrompt(params.firstMessage);
  const modelKey = `${params.provider}/${params.modelId}`;
  
  // Get user's preferred title model from settings
  const preferredTitleModel = getTitleModelPreference();
  
  const modelesAChercher = choisirModelePourTitre({
    preferredModelKey: preferredTitleModel ?? modelKey,
    availableModelKeys: params.availableModelKeys,
    fallbackModelKey: params.fallbackModelKey,
  });

  for (const modele of modelesAChercher) {
    const parsedModel = parseModelKey(modele);
    if (!parsedModel) {
      continue;
    }

    const ephemeralId = `title-${Date.now()}-${crypto.randomUUID()}`;
    params.insertConversation({
      id: ephemeralId,
      project_id: params.projectId ?? null,
      title: "Conversation Title Generation",
      model_provider: parsedModel.provider,
      model_id: parsedModel.modelId,
      access_mode: "secure",
      hiddenFromSidebar: true,
    });

    try {
      const startResult = await params.piRuntimeManager.start(ephemeralId);
      if (
        startResult &&
        typeof startResult === "object" &&
        "ok" in startResult &&
        (startResult as { ok?: boolean }).ok === false
      ) {
        params.log?.("Auto-title generation session failed to start", {
          requestedModel: modele,
          repoPath: params.repoPath,
          error:
            "error" in (startResult as Record<string, unknown>)
              ? (startResult as { error?: unknown }).error
              : null,
        });
        continue;
      }

      const setModelResponse = await params.piRuntimeManager.sendCommand(
        ephemeralId,
        {
          type: "set_model",
          provider: parsedModel.provider,
          modelId: parsedModel.modelId,
        },
      );

      if (!setModelResponse.success) {
        params.log?.("Auto-title generation model selection failed", {
          requestedModel: modele,
          repoPath: params.repoPath,
          error: setModelResponse.error ?? null,
        });
        continue;
      }

      const response = await params.piRuntimeManager.sendCommand(ephemeralId, {
        type: "prompt",
        message: prompt,
      });

      if (!response.success) {
        params.log?.("Auto-title generation prompt failed", {
          requestedModel: modele,
          repoPath: params.repoPath,
          error: response.error ?? null,
          promptPreview: normaliserTitre(prompt).slice(0, 200),
        });
        continue;
      }

      const snapshot = await params.piRuntimeManager.getSnapshot(ephemeralId);
      const rawTitle = extractAssistantTextFromSnapshot(snapshot) ?? "";
      const titre = sanitiserTitreStrict(rawTitle);
      if (titre) {
        return titre;
      }

      params.log?.("Auto-title generation returned unusable title", {
        requestedModel: modele,
        rawOutputPreview: normaliserTitre(rawTitle).slice(0, 160),
      });
    } catch (error) {
      params.log?.("Auto-title generation session errored", {
        requestedModel: modele,
        repoPath: params.repoPath,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      void params.piRuntimeManager.stop(ephemeralId).catch(() => {});
    }
  }

  return null;
}
