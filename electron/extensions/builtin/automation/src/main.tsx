import React from 'react'
import ReactDOM from 'react-dom/client'

import './automation.css'

type Project = {
  id: string
  name?: string | null
  repoName?: string | null
}

type PiModel = {
  id: string
  provider: string
  scoped: boolean
  key: string
}

type AutomationAction =
  | {
      type: 'notify'
      title?: string
      body?: string
      model?: string | null
      projectId?: string | null
    }
  | {
      type: 'executeAndNotify'
      title?: string
      instruction?: string
      model?: string | null
      projectId?: string | null
    }
  | {
      type: 'enqueueEvent'
      topic?: string
      model?: string | null
      projectId?: string | null
    }
  | {
      type: 'runHostCommand'
      method?: string
      params?: Record<string, unknown>
      model?: string | null
      projectId?: string | null
    }

type AutomationRule = {
  id: string
  name: string
  enabled: boolean
  trigger: string
  triggerData?: string | null
  conditions: unknown[]
  actions: AutomationAction[]
  cooldown: number
  runOnce: boolean
  createdAt: string
  updatedAt: string
}

type AutomationRun = {
  id: string
  ruleId: string
  eventTopic?: string | null
  eventPayload?: unknown
  status: 'ok' | 'error'
  errorMessage?: string | null
  createdAt: string
}

type ExtensionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { message?: string } }

type TriggerOption = {
  value: string
  label: string
}

type ActionOption = {
  value: AutomationAction['type']
  label: string
}

type DraftState = {
  id?: string
  name: string
  instruction: string
  trigger: string
  actionType: AutomationAction['type']
  cooldown: number
  projectId: string
  model: string
  runOnce: boolean
  extensionEventName: string
  cronExpression: string
}

declare global {
  interface Window {
    chaton: {
      extensionCall: (
        callerExtensionId: string,
        extensionId: string,
        apiName: string,
        versionRange: string,
        payload: unknown,
      ) => Promise<ExtensionResult<any>>
      extensionHostCall: (
        extensionId: string,
        method: string,
        params?: Record<string, unknown>,
      ) => Promise<ExtensionResult<any>>
      getInitialState: () => Promise<{ projects?: Project[] }>
      listPiModels: () => Promise<
        | { ok: true; models: PiModel[] }
        | { ok: false; reason?: string; message?: string }
      >
    }
  }
}

const EXTENSION_ID = '@chaton/automation'
const MODEL_KEY = 'dashboard:automation-model'

const triggerOptions: TriggerOption[] = [
  { value: 'conversation.created', label: 'New conversation' },
  { value: 'conversation.message.received', label: 'New message' },
  { value: 'conversation.agent.ended', label: 'Agent finished' },
  { value: 'project.created', label: 'New project' },
  { value: 'extension.event', label: 'Extension event' },
  { value: 'cron', label: 'Schedule (cron)' },
]

const actionOptions: ActionOption[] = [
  { value: 'notify', label: 'Notify' },
  { value: 'executeAndNotify', label: 'Run and notify' },
  { value: 'enqueueEvent', label: 'Queue event' },
  { value: 'runHostCommand', label: 'Open a Chatons view' },
]

const cooldownOptions = [
  { value: 0, label: 'None' },
  { value: 60_000, label: '1 minute' },
  { value: 300_000, label: '5 minutes' },
  { value: 900_000, label: '15 minutes' },
  { value: 3_600_000, label: '1 hour' },
  { value: 86_400_000, label: '1 day' },
]

function relativeTime(value: string) {
  const ts = Date.parse(value)
  if (!Number.isFinite(ts)) return 'Unknown time'
  const deltaMinutes = Math.floor((Date.now() - ts) / 60_000)
  if (deltaMinutes < 1) return 'Just now'
  if (deltaMinutes < 60) return `${deltaMinutes} min ago`
  const deltaHours = Math.floor(deltaMinutes / 60)
  if (deltaHours < 24) return `${deltaHours} h ago`
  const deltaDays = Math.floor(deltaHours / 24)
  return `${deltaDays} d ago`
}

function formatDate(value: string) {
  const ts = Date.parse(value)
  if (!Number.isFinite(ts)) return 'Unknown date'
  return new Date(ts).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCooldown(ms: number) {
  const value = Math.max(0, Number(ms) || 0)
  if (value === 0) return 'No cooldown'
  if (value < 60_000) return `${value} ms`
  const minutes = Math.round(value / 60_000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(value / 3_600_000)
  if (hours < 24) return `${hours} h`
  const days = Math.round(value / 86_400_000)
  return `${days} d`
}

function triggerLabel(trigger: string) {
  const labels: Record<string, string> = {
    'conversation.created': 'New conversation',
    'conversation.message.received': 'New message',
    'conversation.agent.ended': 'Agent finished',
    'project.created': 'New project',
    'extension.event': 'Extension event',
    cron: 'Schedule (cron)',
  }
  if (trigger.startsWith('extension.')) {
    return `Event: ${trigger.slice('extension.'.length)}`
  }
  return labels[trigger] || trigger || 'Unknown trigger'
}

function actionTypeLabel(type: AutomationAction['type'] | string | undefined) {
  const labels: Record<string, string> = {
    notify: 'Notification',
    executeAndNotify: 'Run and notify',
    enqueueEvent: 'Queue event',
    runHostCommand: 'Open a Chatons view',
  }
  return labels[type || ''] || type || 'Unknown action'
}

function clamp(text: string, max: number) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function getPrimaryAction(rule: AutomationRule | null | undefined) {
  if (!rule || !Array.isArray(rule.actions) || rule.actions.length === 0) return null
  const action = rule.actions[0]
  return action && typeof action === 'object' ? action : null
}

function summarizeAction(rule: AutomationRule) {
  const action = getPrimaryAction(rule)
  if (!action) return 'No action configured'
  if (action.type === 'notify') return action.body || action.title || 'Notification'
  if (action.type === 'executeAndNotify') return action.instruction || 'Run instruction'
  if (action.type === 'enqueueEvent') return action.topic || 'Queued event'
  if (action.type === 'runHostCommand') return action.method || 'Host command'
  return actionTypeLabel(action.type)
}

function buildDefaultDraft(savedModel: string): DraftState {
  return {
    name: '',
    instruction: '',
    trigger: 'conversation.created',
    actionType: 'notify',
    cooldown: 0,
    projectId: '',
    model: savedModel,
    runOnce: false,
    extensionEventName: '',
    cronExpression: '',
  }
}

function mapPlan(text: string, projects: Project[]) {
  const trimmed = String(text || '').trim()
  const low = trimmed.toLowerCase()

  let trigger = 'conversation.created'
  let triggerData = ''

  const timePatterns = [
    /(?:each|every|daily|weekly|quotidien|hebdomadaire)/i,
    /\d+\s*(?:min|minute|minutes|h|hour|hours|day|days|week|weeks|jour|jours|semaine|semaines)/i,
    /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i,
    /(?:\d{1,2})[:h](?:\d{2})?\s*(?:am|pm|h)?/i,
  ]

  if (timePatterns.some((pattern) => pattern.test(trimmed)) || low.includes('cron') || low.includes('schedule')) {
    trigger = 'cron'
    triggerData = trimmed
  } else if (low.includes('message')) {
    trigger = 'conversation.message.received'
  } else if (low.includes('project') || low.includes('projet')) {
    trigger = 'project.created'
  } else if (low.includes('finish') || low.includes('done') || low.includes('termin')) {
    trigger = 'conversation.agent.ended'
  }

  let action: AutomationAction['type'] = 'notify'
  if (low.includes('enqueue') || low.includes('queue') || low.includes('event')) {
    action = 'enqueueEvent'
  } else if (
    low.includes('weather') ||
    low.includes('api') ||
    low.includes('fetch') ||
    low.includes('data') ||
    low.includes('query') ||
    low.includes('check') ||
    low.includes('summary') ||
    low.includes('report') ||
    low.includes('resume')
  ) {
    action = 'executeAndNotify'
  } else if (low.includes('open')) {
    action = 'runHostCommand'
  }

  let cooldown = 0
  let match = low.match(/(\d+)\s*(min|minute|minutes)/)
  if (match) cooldown = Number(match[1]) * 60_000
  match = low.match(/(\d+)\s*(h|hour|hours|heure|heures)/)
  if (match) cooldown = Number(match[1]) * 3_600_000

  let projectId = ''
  for (const project of projects) {
    const haystack = `${project.name || ''} ${project.repoName || ''}`.toLowerCase()
    if (haystack && low.includes(haystack.trim())) {
      projectId = project.id
      break
    }
  }

  return {
    name: trimmed || 'New automation',
    trigger,
    action,
    cooldown,
    projectId,
    triggerData,
  }
}

async function extensionCall<T>(apiName: string, payload: unknown): Promise<T> {
  const result = await window.chaton.extensionCall('chatons-ui', EXTENSION_ID, apiName, '^1.0.0', payload)
  if (!result.ok) {
    throw new Error(result.error?.message || `Extension call failed: ${apiName}`)
  }
  return result.data as T
}

async function loadProjects() {
  const state = await window.chaton.getInitialState()
  return state.projects || []
}

async function loadModels() {
  const result = await window.chaton.listPiModels()
  if (!result.ok) return []
  return result.models || []
}

function normalizeRuleDraft(rule: AutomationRule, savedModel: string): DraftState {
  const action = getPrimaryAction(rule)
  const cooldown = Number(rule.cooldown) || 0
  let extensionEventName = ''
  if (rule.trigger.startsWith('extension.') && rule.trigger !== 'extension.event') {
    extensionEventName = rule.trigger.slice('extension.'.length)
  }
  return {
    id: rule.id,
    name: rule.name || '',
    instruction:
      action?.type === 'notify'
        ? action.body || ''
        : action?.type === 'executeAndNotify'
          ? action.instruction || ''
          : '',
    trigger:
      rule.trigger.startsWith('extension.') && rule.trigger !== 'extension.event'
        ? 'extension.event'
        : rule.trigger || 'conversation.created',
    actionType: (action?.type as AutomationAction['type']) || 'notify',
    cooldown,
    projectId: String(action?.projectId || ''),
    model: String(action?.model || savedModel || ''),
    runOnce: Boolean(rule.runOnce),
    extensionEventName,
    cronExpression: String(rule.triggerData || ''),
  }
}

function ruleStatusLabel(rule: AutomationRule) {
  if (rule.runOnce) return rule.enabled ? 'Run once' : 'Completed'
  return rule.enabled ? 'Active' : 'Paused'
}

function runStatusLabel(run: AutomationRun) {
  return run.status === 'error' ? 'Failed' : 'Succeeded'
}

function buildActionFromDraft(draft: DraftState): AutomationAction {
  if (draft.actionType === 'notify') {
    return {
      type: 'notify',
      title: `Automation: ${draft.name}`,
      body: draft.instruction || `Trigger ${draft.trigger}`,
      ...(draft.model ? { model: draft.model } : {}),
      ...(draft.projectId ? { projectId: draft.projectId } : {}),
    }
  }
  if (draft.actionType === 'executeAndNotify') {
    return {
      type: 'executeAndNotify',
      title: `Automation: ${draft.name}`,
      instruction: draft.instruction,
      ...(draft.model ? { model: draft.model } : {}),
      ...(draft.projectId ? { projectId: draft.projectId } : {}),
    }
  }
  if (draft.actionType === 'enqueueEvent') {
    return {
      type: 'enqueueEvent',
      topic: `automation.${draft.trigger === 'extension.event' && draft.extensionEventName ? `extension.${draft.extensionEventName}` : draft.trigger}`,
      ...(draft.model ? { model: draft.model } : {}),
      ...(draft.projectId ? { projectId: draft.projectId } : {}),
    }
  }
  return {
    type: 'runHostCommand',
    method: 'open.mainView',
    params: { viewId: 'automation.main' },
    ...(draft.model ? { model: draft.model } : {}),
    ...(draft.projectId ? { projectId: draft.projectId } : {}),
  }
}

function AutomationApp() {
  const initialSavedModel = React.useMemo(() => localStorage.getItem(MODEL_KEY) || '', [])
  const [rules, setRules] = React.useState<AutomationRule[]>([])
  const [runs, setRuns] = React.useState<AutomationRun[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [models, setModels] = React.useState<PiModel[]>([])
  const [selected, setSelected] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DraftState>(() => buildDefaultDraft(initialSavedModel))
  const [saving, setSaving] = React.useState(false)
  const [modalError, setModalError] = React.useState<string | null>(null)

  const projectNameById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) {
      map.set(project.id, project.name || project.repoName || project.id)
    }
    return map
  }, [projects])

  const scopedModels = React.useMemo(() => {
    const sorted = models.filter((model) => model.scoped)
    sorted.sort((a, b) => a.key.localeCompare(b.key))
    return sorted
  }, [models])

  const selectedRule = React.useMemo(() => {
    if (!selected?.startsWith('rule:')) return null
    return rules.find((rule) => `rule:${rule.id}` === selected) ?? null
  }, [rules, selected])

  const selectedRun = React.useMemo(() => {
    if (!selected?.startsWith('run:')) return null
    return runs.find((run) => `run:${run.id}` === selected) ?? null
  }, [runs, selected])

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesData, runsData, projectsData, modelsData] = await Promise.all([
        extensionCall<AutomationRule[]>('automation.rules.list', {}),
        extensionCall<AutomationRun[]>('automation.runs.list', { limit: 80 }),
        loadProjects(),
        loadModels(),
      ])
      setRules(rulesData)
      setRuns(runsData)
      setProjects(projectsData)
      setModels(modelsData)
      setSelected((current) => {
        if (!current) return null
        const stillExists =
          rulesData.some((rule) => `rule:${rule.id}` === current) ||
          runsData.some((run) => `run:${run.id}` === current)
        return stillExists ? current : null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load automations')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== 'chaton.extension.deeplink') return
      const payload = data.payload || {}
      if (payload.viewId !== 'automation.main') return
      if (payload.target === 'open-create-automation') {
        setDraft(buildDefaultDraft(localStorage.getItem(MODEL_KEY) || ''))
        setModalError(null)
        setModalOpen(true)
      }
      if (payload.target === 'open-create-automation-suggestion') {
        const params = payload.params && typeof payload.params === 'object' ? payload.params as Record<string, unknown> : {}
        setDraft({
          ...buildDefaultDraft(localStorage.getItem(MODEL_KEY) || ''),
          name: typeof params.name === 'string' ? params.name : '',
          instruction: typeof params.instruction === 'string' ? params.instruction : '',
          trigger: typeof params.trigger === 'string' ? params.trigger : 'cron',
          actionType: typeof params.actionType === 'string' ? params.actionType as AutomationAction['type'] : 'executeAndNotify',
          cooldown: Math.max(0, Number(params.cooldown) || 0),
          runOnce: params.runOnce === true,
          cronExpression: typeof params.triggerData === 'string' ? params.triggerData : '',
        })
        setModalError(null)
        setModalOpen(true)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const scheduledRules = React.useMemo(() => rules, [rules])

  const runBuckets = React.useMemo(() => {
    const now = Date.now()
    const finished: AutomationRun[] = []
    const archived: AutomationRun[] = []
    for (const run of runs) {
      const ts = Date.parse(run.createdAt || '')
      const old = Number.isFinite(ts) ? now - ts > 3 * 24 * 3_600_000 : false
      if (run.status === 'error' || old) archived.push(run)
      else finished.push(run)
    }
    return { finished, archived }
  }, [runs])

  const openCreateModal = React.useCallback(() => {
    setDraft(buildDefaultDraft(localStorage.getItem(MODEL_KEY) || ''))
    setModalError(null)
    setModalOpen(true)
  }, [])

  const openEditModal = React.useCallback(
    (rule: AutomationRule) => {
      setDraft(normalizeRuleDraft(rule, localStorage.getItem(MODEL_KEY) || ''))
      setModalError(null)
      setModalOpen(true)
    },
    [],
  )

  const closeModal = React.useCallback(() => {
    setModalOpen(false)
    setSaving(false)
    setModalError(null)
    setDraft(buildDefaultDraft(localStorage.getItem(MODEL_KEY) || ''))
  }, [])

  const saveRule = React.useCallback(async () => {
    if (!draft.name.trim()) {
      setModalError('Automation name is required.')
      return
    }
    if (draft.trigger === 'cron' && !draft.cronExpression.trim()) {
      setModalError('Cron expression is required for scheduled automations.')
      return
    }
    if (draft.trigger === 'extension.event' && !draft.extensionEventName.trim()) {
      setModalError('Extension event name is required.')
      return
    }
    if (draft.actionType === 'executeAndNotify' && !draft.instruction.trim()) {
      setModalError('Instruction is required for "Run and notify".')
      return
    }

    setSaving(true)
    setModalError(null)
    try {
      if (draft.model) {
        localStorage.setItem(MODEL_KEY, draft.model)
      } else {
        localStorage.removeItem(MODEL_KEY)
      }

      const finalTrigger =
        draft.trigger === 'extension.event' && draft.extensionEventName.trim()
          ? `extension.${draft.extensionEventName.trim()}`
          : draft.trigger

      const payload: Record<string, unknown> = {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        trigger: finalTrigger,
        enabled: true,
        conditions: [],
        actions: [buildActionFromDraft(draft)],
        cooldown: Math.max(0, Number(draft.cooldown) || 0),
        runOnce: draft.runOnce,
      }

      if (draft.trigger === 'cron' && draft.cronExpression.trim()) {
        payload.triggerData = draft.cronExpression.trim()
      }

      if (draft.id) {
        const currentRule = rules.find((rule) => rule.id === draft.id)
        if (currentRule) payload.enabled = currentRule.enabled
      }

      await extensionCall<{ id: string }>('automation.rules.save', payload)
      closeModal()
      await refresh()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Unable to save automation.')
    } finally {
      setSaving(false)
    }
  }, [closeModal, draft, refresh, rules])

  const toggleRule = React.useCallback(
    async (rule: AutomationRule) => {
      try {
        const action = getPrimaryAction(rule)
        await extensionCall<{ id: string }>('automation.rules.save', {
          id: rule.id,
          name: rule.name,
          trigger: rule.trigger,
          enabled: !rule.enabled,
          conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
          actions: rule.actions,
          cooldown: rule.cooldown,
          runOnce: rule.runOnce,
          triggerData: rule.triggerData || undefined,
          ...(action?.model ? { model: action.model } : {}),
        })
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update automation.')
      }
    },
    [refresh],
  )

  const deleteRule = React.useCallback(
    async (rule: AutomationRule) => {
      const confirmed = window.confirm(`Delete automation "${rule.name || 'Untitled'}"?`)
      if (!confirmed) return
      try {
        await extensionCall<void>('automation.rules.delete', { id: rule.id })
        setSelected((current) => (current === `rule:${rule.id}` ? null : current))
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete automation.')
      }
    },
    [refresh],
  )

  const fillFromInstruction = React.useCallback(() => {
    const plan = mapPlan(draft.instruction, projects)
    setDraft((current) => ({
      ...current,
      name: plan.name,
      trigger: plan.trigger,
      actionType: plan.action,
      cooldown: plan.cooldown,
      projectId: plan.projectId,
      cronExpression: plan.triggerData || current.cronExpression,
    }))
  }, [draft.instruction, projects])

  const detailRuleAction = selectedRule ? getPrimaryAction(selectedRule) : null

  return (
    <div className="automation-app">
      <aside className="automation-sidebar">
        <div className="automation-sidebar__header">
          <div>
            <h1 className="automation-title">Automations</h1>
            <p className="automation-subtitle">Program recurring or event-driven tasks for Chatons.</p>
          </div>
        </div>

        <div className="automation-sidebar__toolbar">
          <button className="automation-button automation-button--primary" onClick={openCreateModal}>
            New automation
          </button>
        </div>

        {error ? <div className="automation-banner automation-banner--error">{error}</div> : null}
        {loading ? <div className="automation-empty">Loading automations…</div> : null}

        {!loading ? (
          <div className="automation-lists">
            <section className="automation-section">
              <div className="automation-section__header">
                <h2>Rules</h2>
                <span>{scheduledRules.length}</span>
              </div>
              <div className="automation-list">
                {scheduledRules.length === 0 ? (
                  <div className="automation-empty">No automation rules yet.</div>
                ) : (
                  scheduledRules.map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      className={`automation-row ${selected === `rule:${rule.id}` ? 'automation-row--active' : ''}`}
                      onClick={() => setSelected(`rule:${rule.id}`)}
                    >
                      <div className="automation-row__top">
                        <span className={`automation-pill ${rule.enabled ? 'automation-pill--primary' : ''}`}>
                          {ruleStatusLabel(rule)}
                        </span>
                        <span className="automation-row__time">{relativeTime(rule.updatedAt)}</span>
                      </div>
                      <div className="automation-row__title">{rule.name || 'Untitled automation'}</div>
                      <div className="automation-badges">
                        <span className="automation-badge">{triggerLabel(rule.trigger)}</span>
                        <span className="automation-badge">{formatCooldown(rule.cooldown)}</span>
                      </div>
                      <div className="automation-row__preview">{clamp(summarizeAction(rule), 110)}</div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="automation-section">
              <div className="automation-section__header">
                <h2>Recent runs</h2>
                <span>{runBuckets.finished.length}</span>
              </div>
              <div className="automation-list">
                {runBuckets.finished.length === 0 ? (
                  <div className="automation-empty">No recent executions.</div>
                ) : (
                  runBuckets.finished.map((run) => {
                    const rule = rules.find((item) => item.id === run.ruleId)
                    return (
                      <button
                        key={run.id}
                        type="button"
                        className={`automation-row ${selected === `run:${run.id}` ? 'automation-row--active' : ''}`}
                        onClick={() => setSelected(`run:${run.id}`)}
                      >
                        <div className="automation-row__top">
                          <span className="automation-pill">{runStatusLabel(run)}</span>
                          <span className="automation-row__time">{relativeTime(run.createdAt)}</span>
                        </div>
                        <div className="automation-row__title">{rule?.name || 'Unknown automation'}</div>
                        <div className="automation-row__preview">
                          {clamp(run.status === 'error' ? run.errorMessage || 'Execution failed' : triggerLabel(run.eventTopic || ''), 100)}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </section>

            <section className="automation-section">
              <div className="automation-section__header">
                <h2>Archived runs</h2>
                <span>{runBuckets.archived.length}</span>
              </div>
              <div className="automation-list">
                {runBuckets.archived.length === 0 ? (
                  <div className="automation-empty">No archived executions.</div>
                ) : (
                  runBuckets.archived.map((run) => {
                    const rule = rules.find((item) => item.id === run.ruleId)
                    return (
                      <button
                        key={run.id}
                        type="button"
                        className={`automation-row ${selected === `run:${run.id}` ? 'automation-row--active' : ''}`}
                        onClick={() => setSelected(`run:${run.id}`)}
                      >
                        <div className="automation-row__top">
                          <span className={`automation-pill ${run.status === 'error' ? 'automation-pill--danger' : ''}`}>
                            {runStatusLabel(run)}
                          </span>
                          <span className="automation-row__time">{relativeTime(run.createdAt)}</span>
                        </div>
                        <div className="automation-row__title">{rule?.name || 'Unknown automation'}</div>
                        <div className="automation-row__preview">
                          {clamp(run.status === 'error' ? run.errorMessage || 'Execution failed' : triggerLabel(run.eventTopic || ''), 100)}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </section>
          </div>
        ) : null}
      </aside>

      <main className="automation-detail">
        {!selectedRule && !selectedRun ? (
          <div className="automation-detail__empty">
            <h2>Select an automation</h2>
            <p>Choose a rule or run to inspect its configuration and context.</p>
          </div>
        ) : null}

        {selectedRule ? (
          <div className="automation-card">
            <div className="automation-card__header">
              <div>
                <h2 className="automation-card__title">{selectedRule.name || 'Untitled automation'}</h2>
                <p className="automation-card__meta">
                  {triggerLabel(selectedRule.trigger)} · updated {relativeTime(selectedRule.updatedAt)}
                </p>
              </div>
              <div className="automation-card__actions">
                <button className="automation-button automation-button--ghost" onClick={() => openEditModal(selectedRule)}>
                  Edit
                </button>
                <button className="automation-button automation-button--ghost" onClick={() => void toggleRule(selectedRule)}>
                  {selectedRule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="automation-button automation-button--danger" onClick={() => void deleteRule(selectedRule)}>
                  Delete
                </button>
              </div>
            </div>

            <div className="automation-badges automation-badges--detail">
              <span className="automation-badge">{ruleStatusLabel(selectedRule)}</span>
              <span className="automation-badge">{triggerLabel(selectedRule.trigger)}</span>
              <span className="automation-badge">{formatCooldown(selectedRule.cooldown)}</span>
              <span className="automation-badge">{actionTypeLabel(detailRuleAction?.type)}</span>
            </div>

            <div className="automation-highlight-grid">
              <div className="automation-highlight">
                <span>Instruction</span>
                <strong>{summarizeAction(selectedRule)}</strong>
              </div>
              <div className="automation-highlight">
                <span>Scope</span>
                <strong>{detailRuleAction?.projectId ? projectNameById.get(detailRuleAction.projectId) || detailRuleAction.projectId : 'Global'}</strong>
              </div>
            </div>

            <div className="automation-meta-grid">
              <div>
                <span>ID</span>
                <strong>{selectedRule.id}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{ruleStatusLabel(selectedRule)}</strong>
              </div>
              <div>
                <span>Trigger</span>
                <strong>{triggerLabel(selectedRule.trigger)}</strong>
              </div>
              <div>
                <span>Cooldown</span>
                <strong>{formatCooldown(selectedRule.cooldown)}</strong>
              </div>
              <div>
                <span>Model</span>
                <strong>{detailRuleAction?.model || 'Default model'}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>{formatDate(selectedRule.updatedAt)}</strong>
              </div>
            </div>

            {detailRuleAction?.type === 'executeAndNotify' || detailRuleAction?.type === 'notify' ? (
              <section className="automation-section-block">
                <h3>Main content</h3>
                <pre className="automation-code">{detailRuleAction.type === 'executeAndNotify' ? detailRuleAction.instruction || '-' : detailRuleAction.body || '-'}</pre>
              </section>
            ) : null}

            <section className="automation-section-block">
              <h3>Full action payload</h3>
              <pre className="automation-code">{JSON.stringify(selectedRule.actions || [], null, 2)}</pre>
            </section>
          </div>
        ) : null}

        {selectedRun ? (
          <div className="automation-card">
            <div className="automation-card__header">
              <div>
                <h2 className="automation-card__title">{selectedRun.status === 'error' ? 'Execution error' : 'Execution completed'}</h2>
                <p className="automation-card__meta">
                  {triggerLabel(selectedRun.eventTopic || '')} · {relativeTime(selectedRun.createdAt)}
                </p>
              </div>
            </div>

            <div className="automation-status-row">
              <span className={`automation-pill ${selectedRun.status === 'error' ? 'automation-pill--danger' : 'automation-pill--primary'}`}>
                {runStatusLabel(selectedRun)}
              </span>
              <span className="automation-card__meta">{formatDate(selectedRun.createdAt)}</span>
            </div>

            <div className="automation-meta-grid">
              <div>
                <span>Execution ID</span>
                <strong>{selectedRun.id}</strong>
              </div>
              <div>
                <span>Rule ID</span>
                <strong>{selectedRun.ruleId}</strong>
              </div>
              <div>
                <span>Trigger</span>
                <strong>{triggerLabel(selectedRun.eventTopic || '')}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{formatDate(selectedRun.createdAt)}</strong>
              </div>
            </div>

            {selectedRun.eventPayload && typeof selectedRun.eventPayload === 'object' ? (
              <section className="automation-section-block">
                <h3>Context</h3>
                <pre className="automation-code">{JSON.stringify(selectedRun.eventPayload, null, 2)}</pre>
              </section>
            ) : null}

            {selectedRun.errorMessage ? (
              <section className="automation-section-block">
                <h3>Error</h3>
                <div className="automation-error-box">{selectedRun.errorMessage}</div>
              </section>
            ) : null}
          </div>
        ) : null}
      </main>

      {modalOpen ? (
        <div className="automation-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="automation-modal-title" onClick={(event) => {
          if (event.target === event.currentTarget) closeModal()
        }}>
          <div className="automation-modal">
            <div className="automation-modal__header">
              <h3 id="automation-modal-title">{draft.id ? 'Edit automation' : 'Create automation'}</h3>
            </div>

            <div className="automation-form-grid">
              <label className="automation-field">
                <span>Name</span>
                <input
                  className="automation-input"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Check alerts"
                />
              </label>
              <label className="automation-field automation-field--wide">
                <span>Instruction</span>
                <textarea
                  className="automation-textarea"
                  value={draft.instruction}
                  onChange={(event) => setDraft((current) => ({ ...current, instruction: event.target.value }))}
                  placeholder="Summarize active conversations every weekday morning."
                />
              </label>
            </div>

            <div className="automation-inline-grid">
              <label className="automation-field">
                <span>Trigger</span>
                <select
                  className="automation-select"
                  value={draft.trigger}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      trigger: event.target.value,
                      ...(event.target.value !== 'cron' ? { cronExpression: '' } : {}),
                      ...(event.target.value !== 'extension.event' ? { extensionEventName: '' } : {}),
                    }))
                  }
                >
                  {triggerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="automation-field">
                <span>Action</span>
                <select
                  className="automation-select"
                  value={draft.actionType}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, actionType: event.target.value as AutomationAction['type'] }))
                  }
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {draft.trigger === 'extension.event' ? (
              <label className="automation-field">
                <span>Extension event name</span>
                <input
                  className="automation-input"
                  value={draft.extensionEventName}
                  onChange={(event) => setDraft((current) => ({ ...current, extensionEventName: event.target.value }))}
                  placeholder="my-event"
                />
              </label>
            ) : null}

            {draft.trigger === 'cron' ? (
              <label className="automation-field">
                <span>Cron expression</span>
                <input
                  className="automation-input automation-input--mono"
                  value={draft.cronExpression}
                  onChange={(event) => setDraft((current) => ({ ...current, cronExpression: event.target.value }))}
                  placeholder="0 9 * * 1-5"
                />
              </label>
            ) : null}

            <div className="automation-inline-grid">
              <label className="automation-field">
                <span>Cooldown</span>
                <select
                  className="automation-select"
                  value={String(draft.cooldown)}
                  onChange={(event) => setDraft((current) => ({ ...current, cooldown: Number(event.target.value) || 0 }))}
                >
                  {cooldownOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="automation-field">
                <span>Project</span>
                <select
                  className="automation-select"
                  value={draft.projectId}
                  onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
                >
                  <option value="">All projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.repoName || project.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="automation-inline-grid automation-inline-grid--align-end">
              <label className="automation-field">
                <span>Model</span>
                <select
                  className="automation-select"
                  value={draft.model}
                  onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
                >
                  <option value="">Default model</option>
                  {scopedModels.map((model) => (
                    <option key={model.key} value={model.key}>
                      {model.id} ({model.provider})
                    </option>
                  ))}
                </select>
              </label>

              <label className="automation-checkbox">
                <input
                  type="checkbox"
                  checked={draft.runOnce}
                  onChange={(event) => setDraft((current) => ({ ...current, runOnce: event.target.checked }))}
                />
                <span>Run only once</span>
              </label>
            </div>

            {modalError ? <div className="automation-banner automation-banner--error">{modalError}</div> : null}

            <div className="automation-modal__actions">
              <button className="automation-button automation-button--ghost" onClick={fillFromInstruction}>
                AI prefill
              </button>
              <div className="automation-modal__actions-right">
                <button className="automation-button automation-button--ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button className="automation-button automation-button--primary" onClick={() => void saveRule()} disabled={saving}>
                  {saving ? 'Saving…' : draft.id ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function mount() {
  let container = document.getElementById('root')
  if (!(container instanceof HTMLElement)) {
    if (!document.body) {
      return false
    }
    container = document.createElement('div')
    container.id = 'root'
    document.body.appendChild(container)
  }

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <AutomationApp />
    </React.StrictMode>,
  )
  return true
}

if (!mount()) {
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      mount()
    },
    { once: true },
  )
}
