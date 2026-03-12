import { getDb } from '../../db/index.js'
import { listAutomationRules } from '../../db/repos/automation.js'
import { listConversationMessagesCache } from '../../db/repos/conversations.js'
import type { ExtensionHostCallResult } from './types.js'

type SuggestionPatternId = 'weather-check' | 'meeting-summary'

type SuggestionPattern = {
  id: SuggestionPatternId
  title: string
  body: string
  automationName: string
  instruction: string
  trigger: 'cron'
  signalPhrases: string[]
}

type AutomationSuggestionDraft = {
  name: string
  instruction: string
  trigger: 'cron'
  actionType: 'executeAndNotify'
  cooldown: number
}

type SuggestionHistoryEntry = {
  patternId: SuggestionPatternId
  count: number
  firstSeenAt: string
  lastSeenAt: string
  lastConversationId?: string
  lastSuggestedAt?: string
}

type SuggestionHistory = Record<string, SuggestionHistoryEntry>

const AUTOMATION_SUGGESTION_SETTINGS_KEY = 'automation_suggestion_history'
const MIN_PATTERN_COUNT = 3
const MIN_SPAN_MS = 12 * 60 * 60 * 1000
const SUGGESTION_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

const PATTERNS: SuggestionPattern[] = [
  {
    id: 'weather-check',
    title: 'You often ask for the weather',
    body:
      'Chatons can suggest an automation to check the weather on a schedule and notify you automatically.',
    automationName: 'Weather check',
    instruction:
      'Check the weather forecast for the user and send a concise notification with the conditions and important changes.',
    trigger: 'cron',
    signalPhrases: ['weather', 'forecast', 'temperature', 'rain', 'meteo'],
  },
  {
    id: 'meeting-summary',
    title: 'You often ask for meeting summaries',
    body:
      'Chatons can suggest an automation to remind you to prepare a meeting summary on a recurring schedule.',
    automationName: 'Meeting summary',
    instruction:
      'Remind the user to collect the latest meeting notes or recording and prepare a concise meeting summary.',
    trigger: 'cron',
    signalPhrases: [
      'meeting summary',
      'summary of a meeting',
      'summarize meeting',
      'meeting recap',
      'meeting notes',
    ],
  },
]

function getSuggestionHistory(): SuggestionHistory {
  const db = getDb()
  const row = db
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(AUTOMATION_SUGGESTION_SETTINGS_KEY) as { value: string } | undefined
  if (!row?.value) return {}
  try {
    const parsed = JSON.parse(row.value) as SuggestionHistory
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveSuggestionHistory(history: SuggestionHistory) {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO app_settings(key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
  ).run(AUTOMATION_SUGGESTION_SETTINGS_KEY, JSON.stringify(history), now)
}

function extractUserText(conversationId: string): string {
  const rows = listConversationMessagesCache(getDb(), conversationId)
  const texts: string[] = []
  for (const row of rows) {
    if (row.role !== 'user') continue
    try {
      const payload = JSON.parse(row.payload_json) as Record<string, unknown>
      const content = payload.content
      if (typeof content === 'string' && content.trim()) {
        texts.push(content.trim())
        continue
      }
      if (Array.isArray(content)) {
        const combined = content
          .filter(
            (part): part is { type: 'text'; text: string } =>
              !!part &&
              typeof part === 'object' &&
              (part as Record<string, unknown>).type === 'text' &&
              typeof (part as Record<string, unknown>).text === 'string',
          )
          .map((part) => part.text.trim())
          .filter(Boolean)
          .join('\n')
        if (combined) texts.push(combined)
      }
    } catch {
      // Ignore malformed rows.
    }
  }
  return texts.join('\n').toLowerCase()
}

function hasAutomationAlready(pattern: SuggestionPattern) {
  const rules = listAutomationRules(getDb())
  const needle = pattern.automationName.toLowerCase()
  return rules.some((rule) => {
    if (!rule.enabled) return false
    const haystack = `${rule.name}\n${rule.actions_json}`.toLowerCase()
    return haystack.includes(needle)
  })
}

function shouldSuggest(entry: SuggestionHistoryEntry, nowMs: number) {
  if (entry.count < MIN_PATTERN_COUNT) return false
  const firstSeen = Date.parse(entry.firstSeenAt)
  const lastSuggested = entry.lastSuggestedAt ? Date.parse(entry.lastSuggestedAt) : 0
  if (Number.isFinite(firstSeen) && nowMs - firstSeen < MIN_SPAN_MS) return false
  if (Number.isFinite(lastSuggested) && lastSuggested > 0 && nowMs - lastSuggested < SUGGESTION_COOLDOWN_MS) return false
  return true
}

export function maybeSuggestAutomationForConversation(
  conversationId: string,
  hostCall: (
    extensionId: string,
    method: string,
    params?: Record<string, unknown>,
  ) => ExtensionHostCallResult | Promise<ExtensionHostCallResult>,
) {
  const text = extractUserText(conversationId)
  if (!text || text.length < 20) return

  const now = new Date()
  const nowIso = now.toISOString()
  const nowMs = now.getTime()
  const history = getSuggestionHistory()

  for (const pattern of PATTERNS) {
    if (!pattern.signalPhrases.some((phrase) => text.includes(phrase))) continue
    if (hasAutomationAlready(pattern)) continue

    const previous = history[pattern.id]
    const entry: SuggestionHistoryEntry = previous
      ? {
          ...previous,
          count: previous.count + 1,
          lastSeenAt: nowIso,
          lastConversationId: conversationId,
        }
      : {
          patternId: pattern.id,
          count: 1,
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          lastConversationId: conversationId,
        }

    history[pattern.id] = entry

    if (!shouldSuggest(entry, nowMs)) continue

    entry.lastSuggestedAt = nowIso
    const draft: AutomationSuggestionDraft = {
      name: pattern.automationName,
      instruction: pattern.instruction,
      trigger: pattern.trigger,
      actionType: 'executeAndNotify',
      cooldown: 86400000,
    }
    void Promise.resolve(
      hostCall('@chaton/automation', 'notifications.notify', {
        title: pattern.title,
        body: pattern.body,
        link: {
          type: 'deeplink',
          href: 'automation-suggestion:open',
          label: 'Review automation',
        },
        meta: {
          automationSuggestionDraft: draft,
        },
      }),
    ).catch(() => undefined)
  }

  saveSuggestionHistory(history)
}
