const MEMORY_SCHEMA_VERSION = 1;

const MEMORY_KINDS = [
  "preference",
  "decision",
  "fact",
  "profile",
  "repo_convention",
  "task_state",
  "summary",
];

const MEMORY_STATUS = {
  ACTIVE: "active",
  SUPERSEDED: "superseded",
};

const MEMORY_VISIBILITY = {
  PRIVATE: "private",
  SHARED: "shared",
};

const MEMORY_CAPTURE_CONFIDENCE_THRESHOLD = 0.55;

const EXACT_MATCH_BOOST = 0.24;
const PARTIAL_MATCH_BOOST = 0.1;
const TAG_MATCH_BOOST = 0.08;
const TOPIC_MATCH_BOOST = 0.12;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeMemoryKind(kind) {
  const raw = typeof kind === "string" ? kind.trim().toLowerCase() : "";
  if (!raw) return "fact";
  if (raw === "conversation-summary" || raw === "context") return "summary";
  if (MEMORY_KINDS.includes(raw)) return raw;
  return "fact";
}

export function normalizeMemoryText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTopicKey(input) {
  const explicit =
    typeof input?.topicKey === "string" ? input.topicKey.trim() : "";
  if (explicit) return normalizeMemoryText(explicit).replace(/[^a-z0-9]+/g, "-");

  const seed = [
    input?.kind ? normalizeMemoryKind(input.kind) : "",
    typeof input?.title === "string" ? input.title : "",
    typeof input?.content === "string" ? input.content : "",
    Array.isArray(input?.tags) ? input.tags.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ");

  const normalized = normalizeMemoryText(seed);
  if (!normalized) return "memory";
  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "memory";
}

export function buildMemoryFingerprint(input) {
  const parts = [
    typeof input?.scope === "string" ? input.scope : "global",
    typeof input?.organizationId === "string" ? input.organizationId : "",
    typeof input?.userId === "string" ? input.userId : "",
    typeof input?.projectId === "string" ? input.projectId : "",
    normalizeMemoryKind(input?.kind),
    buildTopicKey(input),
  ];
  return parts.join("::");
}

export function shouldSupersedeKind(kind) {
  const normalized = normalizeMemoryKind(kind);
  return (
    normalized === "decision" ||
    normalized === "preference" ||
    normalized === "repo_convention"
  );
}

export function buildMemorySearchText(input) {
  return [
    typeof input?.title === "string" ? input.title.trim() : "",
    typeof input?.content === "string" ? input.content.trim() : "",
    Array.isArray(input?.tags) ? input.tags.join(" ") : "",
    typeof input?.topicKey === "string" ? input.topicKey.trim() : "",
    typeof input?.kind === "string" ? normalizeMemoryKind(input.kind) : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function computeFreshnessFactor(input) {
  const now = Date.now();
  const basisRaw =
    input?.reinforcedAt ||
    input?.lastUsedAt ||
    input?.updatedAt ||
    input?.createdAt ||
    null;
  const basis = basisRaw ? new Date(basisRaw).getTime() : now;
  if (!Number.isFinite(basis)) return 1;

  const ageHours = Math.max(0, (now - basis) / (1000 * 60 * 60));
  const stabilityHours =
    typeof input?.stabilityHours === "number" && Number.isFinite(input.stabilityHours)
      ? Math.max(1, input.stabilityHours)
      : 168;
  if (ageHours <= stabilityHours) return 1;

  const timesUsed =
    typeof input?.timesUsed === "number" && Number.isFinite(input.timesUsed)
      ? Math.max(0, input.timesUsed)
      : 0;
  const effectiveHours = ageHours - stabilityHours;
  const reinforcement = 1 + Math.min(20, timesUsed) * 0.07;
  return Math.exp(-(effectiveHours / (stabilityHours * reinforcement)) * 0.12);
}

function tokenize(value) {
  return normalizeMemoryText(value)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

export function rerankMemoryCandidates(params) {
  const query = typeof params?.query === "string" ? params.query : "";
  const candidates = Array.isArray(params?.candidates) ? params.candidates : [];
  const limit =
    typeof params?.limit === "number" && Number.isFinite(params.limit)
      ? Math.max(1, Math.floor(params.limit))
      : 10;

  const normalizedQuery = normalizeMemoryText(query);
  const queryTokens = tokenize(query);

  return candidates
    .map((candidate) => {
      const title = typeof candidate?.title === "string" ? candidate.title : "";
      const content = typeof candidate?.content === "string" ? candidate.content : "";
      const topicKey = typeof candidate?.topicKey === "string" ? candidate.topicKey : "";
      const tags = Array.isArray(candidate?.tags) ? candidate.tags : [];
      const rawRank =
        typeof candidate?.ftsRank === "number" && Number.isFinite(candidate.ftsRank)
          ? candidate.ftsRank
          : typeof candidate?.score === "number" && Number.isFinite(candidate.score)
            ? candidate.score
            : 0;
      const normalizedRank = clamp(rawRank, 0, 1);

      const titleNorm = normalizeMemoryText(title);
      const contentNorm = normalizeMemoryText(content);
      const topicNorm = normalizeMemoryText(topicKey);
      const tagsNorm = tags.map((tag) => normalizeMemoryText(tag));

      const matchReasons = [];
      let exactBoost = 0;

      if (normalizedQuery && titleNorm === normalizedQuery) {
        exactBoost += EXACT_MATCH_BOOST;
        matchReasons.push("exact_title");
      } else if (normalizedQuery && titleNorm.includes(normalizedQuery)) {
        exactBoost += PARTIAL_MATCH_BOOST;
        matchReasons.push("title");
      }

      if (normalizedQuery && topicNorm === normalizedQuery) {
        exactBoost += TOPIC_MATCH_BOOST;
        matchReasons.push("topic_key");
      } else if (normalizedQuery && topicNorm.includes(normalizedQuery)) {
        exactBoost += TOPIC_MATCH_BOOST * 0.75;
        matchReasons.push("topic_key_partial");
      }

      if (normalizedQuery && contentNorm.includes(normalizedQuery)) {
        exactBoost += PARTIAL_MATCH_BOOST;
        matchReasons.push("content");
      }

      const matchedTagCount = tagsNorm.filter((tag) => {
        if (!tag) return false;
        if (normalizedQuery && tag === normalizedQuery) return true;
        return queryTokens.some((token) => token && tag.includes(token));
      }).length;
      if (matchedTagCount > 0) {
        exactBoost += Math.min(0.16, matchedTagCount * TAG_MATCH_BOOST);
        matchReasons.push("tags");
      }

      const tokenOverlap = queryTokens.length
        ? queryTokens.filter(
            (token) =>
              titleNorm.includes(token) ||
              contentNorm.includes(token) ||
              topicNorm.includes(token) ||
              tagsNorm.some((tag) => tag.includes(token)),
          ).length / queryTokens.length
        : 0;

      const confidence =
        typeof candidate?.confidence === "number" && Number.isFinite(candidate.confidence)
          ? clamp(candidate.confidence, 0, 1)
          : 0.5;
      const importance =
        typeof candidate?.importance === "number" && Number.isFinite(candidate.importance)
          ? clamp(candidate.importance, 0, 1)
          : 0.5;
      const freshness = computeFreshnessFactor(candidate);

      const finalScore = clamp(
        normalizedRank * 0.48 +
          tokenOverlap * 0.18 +
          confidence * 0.12 +
          importance * 0.12 +
          freshness * 0.1 +
          exactBoost,
        0,
        1,
      );

      return {
        ...candidate,
        score: Number(finalScore.toFixed(4)),
        matchReasons,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function buildMemoryCapturePrompt(params) {
  const conversation = typeof params?.conversationText === "string" ? params.conversationText.trim() : "";
  return `You are a memory extraction system for Chatons.

Extract durable memory from this coding-assistant conversation.

Return strict JSON with this shape:
{
  "entries": [
    {
      "kind": "preference|decision|fact|profile|repo_convention|task_state|summary",
      "title": "short title",
      "content": "canonical durable memory text",
      "topicKey": "stable-short-topic-key",
      "tags": ["optional", "tags"],
      "confidence": 0.0,
      "visibility": "private|shared",
      "summaryFallback": false
    }
  ]
}

Rules:
- Extract only durable memories that would help in future conversations.
- Prefer specific facts, preferences, decisions, repo conventions, and durable task state.
- Do not emit duplicates that describe the same topic in slightly different words.
- Only emit "summary" when the conversation has useful context that is not fully covered by stronger typed entries.
- Confidence must be between 0 and 1.
- visibility=private for user-specific personal memory, shared for project memory suitable for collaborators.
- Output JSON only.

Conversation:
${conversation}`;
}

export function parseMemoryCaptureResponse(text) {
  const input = typeof text === "string" ? text : "";
  const jsonMatch = input.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    return entries
      .map((entry) => ({
        kind: normalizeMemoryKind(entry?.kind),
        title: typeof entry?.title === "string" ? entry.title.trim() : "",
        content: typeof entry?.content === "string" ? entry.content.trim() : "",
        topicKey: buildTopicKey(entry),
        tags: Array.isArray(entry?.tags)
          ? entry.tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim())
          : [],
        confidence:
          typeof entry?.confidence === "number" && Number.isFinite(entry.confidence)
            ? clamp(entry.confidence, 0, 1)
            : 0,
        visibility: entry?.visibility === "shared" ? "shared" : "private",
        summaryFallback: entry?.summaryFallback === true,
      }))
      .filter((entry) => entry.content.length > 0);
  } catch {
    return [];
  }
}

export function shouldPersistCapturedEntry(entry) {
  return (
    !!entry &&
    typeof entry.content === "string" &&
    entry.content.trim().length > 0 &&
    typeof entry.confidence === "number" &&
    entry.confidence >= MEMORY_CAPTURE_CONFIDENCE_THRESHOLD
  );
}

export function summarizeMemoryStats(entries) {
  const rows = Array.isArray(entries) ? entries : [];
  const byKind = {};
  const byScope = {};
  let active = 0;
  let superseded = 0;

  for (const entry of rows) {
    const kind = normalizeMemoryKind(entry?.kind);
    const scope = entry?.scope === "project" ? "project" : "global";
    const status = entry?.status === MEMORY_STATUS.SUPERSEDED ? MEMORY_STATUS.SUPERSEDED : MEMORY_STATUS.ACTIVE;
    byKind[kind] = (byKind[kind] || 0) + 1;
    byScope[scope] = (byScope[scope] || 0) + 1;
    if (status === MEMORY_STATUS.ACTIVE) active += 1;
    else superseded += 1;
  }

  return {
    total: rows.length,
    active,
    superseded,
    byKind,
    byScope,
    schemaVersion: MEMORY_SCHEMA_VERSION,
  };
}

export {
  MEMORY_CAPTURE_CONFIDENCE_THRESHOLD,
  MEMORY_KINDS,
  MEMORY_SCHEMA_VERSION,
  MEMORY_STATUS,
  MEMORY_VISIBILITY,
};
