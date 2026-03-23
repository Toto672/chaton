import React from 'react'
import ReactDOM from 'react-dom/client'

import './memory.css'

type MemoryScope = 'global' | 'project' | 'all'

type Project = {
  id: string
  name?: string | null
  repoName?: string | null
}

type MemoryEntry = {
  id: string
  scope: 'global' | 'project'
  projectId?: string | null
  kind: string
  title?: string | null
  content: string
  tags: string[]
  source?: string | null
  createdAt: string
  updatedAt: string
  lastAccessedAt?: string | null
  accessCount?: number
  archived: boolean
}

type ExtensionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { message?: string } }

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
    }
  }
}

const EXTENSION_ID = '@chaton/memory'

const translations = {
  fr: {
    title: 'Memoire',
    subtitle: 'Retenez preferences, faits et contexte durable.',
    search: 'Rechercher',
    searchPlaceholder: 'Rechercher dans la memoire...',
    allScopes: 'Toutes',
    globalScopes: 'Globales',
    projectScopes: 'Projets',
    allKinds: 'Tous les types',
    newEntry: 'Nouvelle memoire',
    noEntries: 'Aucune memoire trouvee.',
    selectMemory: 'Selectionnez une memoire',
    selectDescription: 'Choisissez une entree pour voir ses details ou ajoutez une nouvelle memoire.',
    addMemory: 'Ajouter une memoire',
    cancel: 'Annuler',
    save: 'Enregistrer',
    archive: 'Archiver',
    unarchive: 'Desarchiver',
    delete: 'Supprimer',
    scope: 'Portee',
    project: 'Projet',
    kind: 'Type',
    titleLabel: 'Titre',
    tags: 'Tags',
    content: 'Contenu',
    source: 'Source',
    metadata: 'Metadonnees',
    none: 'Aucun',
    untitled: 'Sans titre',
    updated: 'mis a jour',
    archived: 'Archivee',
    createError: 'Impossible d enregistrer cette memoire.',
    loadError: 'Impossible de charger les memoires.',
  },
  en: {
    title: 'Memory',
    subtitle: 'Keep durable preferences, facts, and context.',
    search: 'Search',
    searchPlaceholder: 'Search memory...',
    allScopes: 'All',
    globalScopes: 'Global',
    projectScopes: 'Projects',
    allKinds: 'All types',
    newEntry: 'New memory',
    noEntries: 'No memories found.',
    selectMemory: 'Select a memory',
    selectDescription: 'Choose an entry to inspect it or add a new memory.',
    addMemory: 'Add a memory',
    cancel: 'Cancel',
    save: 'Save',
    archive: 'Archive',
    unarchive: 'Unarchive',
    delete: 'Delete',
    scope: 'Scope',
    project: 'Project',
    kind: 'Type',
    titleLabel: 'Title',
    tags: 'Tags',
    content: 'Content',
    source: 'Source',
    metadata: 'Metadata',
    none: 'None',
    untitled: 'Untitled',
    updated: 'updated',
    archived: 'Archived',
    createError: 'Unable to save this memory.',
    loadError: 'Unable to load memories.',
  },
} as const

function localeKey() {
  const lang = (navigator.language || 'en').split('-')[0]?.toLowerCase()
  return lang === 'fr' ? 'fr' : 'en'
}

function t(key: keyof (typeof translations)['en']) {
  return translations[localeKey()][key]
}

function relativeTime(value: string) {
  const ts = Date.parse(value)
  if (!Number.isFinite(ts)) return ''
  const deltaMinutes = Math.floor((Date.now() - ts) / 60000)
  if (deltaMinutes < 1) return localeKey() === 'fr' ? "A l'instant" : 'Just now'
  if (deltaMinutes < 60) return `${deltaMinutes} min`
  const deltaHours = Math.floor(deltaMinutes / 60)
  if (deltaHours < 24) return `${deltaHours} h`
  const deltaDays = Math.floor(deltaHours / 24)
  return localeKey() === 'fr' ? `${deltaDays} j` : `${deltaDays} d`
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const ts = Date.parse(value)
  if (!Number.isFinite(ts)) return '-'
  return new Date(ts).toLocaleString(localeKey() === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function kindLabel(kind: string) {
  const map: Record<string, string> = localeKey() === 'fr'
    ? {
        fact: 'Fait',
        preference: 'Preference',
        profile: 'Profil',
        decision: 'Decision',
        context: 'Contexte',
      }
    : {
        fact: 'Fact',
        preference: 'Preference',
        profile: 'Profile',
        decision: 'Decision',
        context: 'Context',
      }
  return map[kind] || kind
}

function scopeLabel(scope: 'global' | 'project') {
  return scope === 'global'
    ? localeKey() === 'fr'
      ? 'Globale'
      : 'Global'
    : localeKey() === 'fr'
      ? 'Projet'
      : 'Project'
}

async function extensionCall<T>(apiName: string, payload: unknown): Promise<T> {
  const result = await window.chaton.extensionCall('chatons-ui', EXTENSION_ID, apiName, '^1.0.0', payload)
  if (!result.ok) {
    throw new Error(result.error?.message || `Extension call failed: ${apiName}`)
  }
  return result.data as T
}

async function listProjects(): Promise<Project[]> {
  const result = await window.chaton.extensionHostCall(EXTENSION_ID, 'projects.list', {})
  if (!result.ok) {
    throw new Error(result.error?.message || 'Failed to load projects')
  }
  return (result.data || []) as Project[]
}

function MemoryApp() {
  const [entries, setEntries] = React.useState<MemoryEntry[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [scope, setScope] = React.useState<MemoryScope>('all')
  const [kind, setKind] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [formScope, setFormScope] = React.useState<'global' | 'project'>('global')
  const [formProjectId, setFormProjectId] = React.useState('')
  const [formKind, setFormKind] = React.useState('fact')
  const [formTitle, setFormTitle] = React.useState('')
  const [formTags, setFormTags] = React.useState('')
  const [formContent, setFormContent] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const selectedEntry = React.useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  )

  const projectNameById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) {
      map.set(project.id, project.name || project.repoName || project.id)
    }
    return map
  }, [projects])

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectsData, memories] = await Promise.all([
        listProjects(),
        searchQuery.trim()
          ? extensionCall<MemoryEntry[]>('memory.search', {
              query: searchQuery.trim(),
              scope,
              kind: kind || undefined,
              limit: 100,
            })
          : extensionCall<MemoryEntry[]>('memory.list', {
              scope,
              kind: kind || undefined,
              limit: 200,
            }),
      ])
      setProjects(projectsData)
      setEntries(memories)
      setSelectedId((current) => (current && memories.some((entry) => entry.id === current) ? current : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [kind, scope, searchQuery])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data
      if (!data || data.type !== 'chaton.extension.deeplink') return
      if (data.payload?.viewId !== 'memory.main') return
      if (data.payload?.target === 'open-create-memory') {
        setModalOpen(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function saveMemory() {
    if (!formContent.trim()) return
    if (formScope === 'project' && !formProjectId) return
    setSaving(true)
    try {
      await extensionCall('memory.upsert', {
        scope: formScope,
        projectId: formScope === 'project' ? formProjectId : undefined,
        kind: formKind,
        title: formTitle.trim() || undefined,
        content: formContent.trim(),
        tags: formTags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        source: 'memory-ui-react',
      })
      setModalOpen(false)
      setFormScope('global')
      setFormProjectId('')
      setFormKind('fact')
      setFormTitle('')
      setFormTags('')
      setFormContent('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createError'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleArchived() {
    if (!selectedEntry) return
    await extensionCall('memory.update', {
      id: selectedEntry.id,
      archived: !selectedEntry.archived,
    })
    await refresh()
  }

  async function deleteEntry() {
    if (!selectedEntry) return
    await extensionCall('memory.delete', { id: selectedEntry.id })
    setSelectedId(null)
    await refresh()
  }

  return (
    <div className="memory-app">
      <aside className="memory-sidebar">
        <div className="memory-sidebar__header">
          <div>
            <h1 className="memory-title">{t('title')}</h1>
            <p className="memory-subtitle">{t('subtitle')}</p>
          </div>
          <button className="memory-button memory-button--ghost memory-button--compact" onClick={() => setModalOpen(true)}>
            {t('newEntry')}
          </button>
        </div>

        <div className="memory-toolbar">
          <input
            className="memory-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
          />
          <button className="memory-button memory-button--outline" onClick={() => void refresh()}>
            {t('search')}
          </button>
        </div>

        <div className="memory-filters">
          <select className="memory-select" value={scope} onChange={(event) => setScope(event.target.value as MemoryScope)}>
            <option value="all">{t('allScopes')}</option>
            <option value="global">{t('globalScopes')}</option>
            <option value="project">{t('projectScopes')}</option>
          </select>
          <select className="memory-select" value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">{t('allKinds')}</option>
            <option value="fact">{kindLabel('fact')}</option>
            <option value="preference">{kindLabel('preference')}</option>
            <option value="profile">{kindLabel('profile')}</option>
            <option value="decision">{kindLabel('decision')}</option>
            <option value="context">{kindLabel('context')}</option>
          </select>
        </div>

        <div className="memory-list">
          {loading ? <div className="memory-empty">Loading...</div> : null}
          {!loading && error ? <div className="memory-empty memory-empty--error">{error}</div> : null}
          {!loading && !error && entries.length === 0 ? <div className="memory-empty">{t('noEntries')}</div> : null}
          {!loading && !error
            ? entries.map((entry) => (
                <button
                  key={entry.id}
                  className={`memory-row${selectedId === entry.id ? ' memory-row--active' : ''}`}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <div className="memory-row__top">
                    <div className="memory-badges">
                      <span className="memory-badge memory-badge--primary">{scopeLabel(entry.scope)}</span>
                      <span className="memory-badge">{kindLabel(entry.kind)}</span>
                      {entry.archived ? <span className="memory-badge">{t('archived')}</span> : null}
                    </div>
                    <span className="memory-row__time">{relativeTime(entry.updatedAt)}</span>
                  </div>
                  <div className="memory-row__title">{entry.title || t('untitled')}</div>
                  <div className="memory-row__preview">{entry.content}</div>
                </button>
              ))
            : null}
        </div>
      </aside>

      <section className="memory-detail">
        {!selectedEntry ? (
          <div className="memory-detail__empty">
            <h2>{t('selectMemory')}</h2>
            <p>{t('selectDescription')}</p>
          </div>
        ) : (
          <div className="memory-detail__card">
            <div className="memory-detail__header">
              <div>
                <h2 className="memory-detail__title">{selectedEntry.title || t('untitled')}</h2>
                <p className="memory-detail__meta">
                  {scopeLabel(selectedEntry.scope)} · {kindLabel(selectedEntry.kind)} · {t('updated')} {relativeTime(selectedEntry.updatedAt)}
                </p>
              </div>
              <div className="memory-detail__actions">
                <button className="memory-button memory-button--outline memory-button--compact" onClick={() => void toggleArchived()}>
                  {selectedEntry.archived ? t('unarchive') : t('archive')}
                </button>
                <button className="memory-button memory-button--danger memory-button--compact" onClick={() => void deleteEntry()}>
                  {t('delete')}
                </button>
              </div>
            </div>

            <div className="memory-badges memory-badges--detail">
              <span className="memory-badge memory-badge--primary">{scopeLabel(selectedEntry.scope)}</span>
              <span className="memory-badge">{kindLabel(selectedEntry.kind)}</span>
              {selectedEntry.source ? <span className="memory-badge">{selectedEntry.source}</span> : null}
            </div>

            <div className="memory-section">
              <h3>{t('content')}</h3>
              <div className="memory-content">{selectedEntry.content}</div>
            </div>

            {selectedEntry.tags.length > 0 ? (
              <div className="memory-section">
                <h3>{t('tags')}</h3>
                <div className="memory-badges">
                  {selectedEntry.tags.map((tag) => (
                    <span key={tag} className="memory-badge">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="memory-section">
              <h3>{t('metadata')}</h3>
              <div className="memory-meta-grid">
                <div><span>ID</span><strong>{selectedEntry.id}</strong></div>
                <div><span>{t('scope')}</span><strong>{scopeLabel(selectedEntry.scope)}</strong></div>
                <div><span>{t('kind')}</span><strong>{kindLabel(selectedEntry.kind)}</strong></div>
                <div><span>{t('project')}</span><strong>{selectedEntry.projectId ? projectNameById.get(selectedEntry.projectId) || selectedEntry.projectId : t('none')}</strong></div>
                <div><span>{t('source')}</span><strong>{selectedEntry.source || t('none')}</strong></div>
                <div><span>Created</span><strong>{formatDate(selectedEntry.createdAt)}</strong></div>
                <div><span>Updated</span><strong>{formatDate(selectedEntry.updatedAt)}</strong></div>
                <div><span>Last accessed</span><strong>{formatDate(selectedEntry.lastAccessedAt)}</strong></div>
              </div>
            </div>
          </div>
        )}
      </section>

      {modalOpen ? (
        <div className="memory-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="memory-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t('addMemory')}</h2>
            <div className="memory-form-grid">
              <label>
                <span>{t('scope')}</span>
                <select className="memory-select" value={formScope} onChange={(event) => setFormScope(event.target.value as 'global' | 'project')}>
                  <option value="global">{scopeLabel('global')}</option>
                  <option value="project">{scopeLabel('project')}</option>
                </select>
              </label>
              <label>
                <span>{t('project')}</span>
                <select className="memory-select" value={formProjectId} onChange={(event) => setFormProjectId(event.target.value)} disabled={formScope !== 'project'}>
                  <option value="">{t('none')}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.repoName || project.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('kind')}</span>
                <select className="memory-select" value={formKind} onChange={(event) => setFormKind(event.target.value)}>
                  <option value="fact">{kindLabel('fact')}</option>
                  <option value="preference">{kindLabel('preference')}</option>
                  <option value="profile">{kindLabel('profile')}</option>
                  <option value="decision">{kindLabel('decision')}</option>
                  <option value="context">{kindLabel('context')}</option>
                </select>
              </label>
              <label>
                <span>{t('titleLabel')}</span>
                <input className="memory-input" value={formTitle} onChange={(event) => setFormTitle(event.target.value)} />
              </label>
            </div>

            <label className="memory-field">
              <span>{t('tags')}</span>
              <input className="memory-input" value={formTags} onChange={(event) => setFormTags(event.target.value)} />
            </label>

            <label className="memory-field">
              <span>{t('content')}</span>
              <textarea className="memory-textarea" value={formContent} onChange={(event) => setFormContent(event.target.value)} />
            </label>

            <div className="memory-modal__actions">
              <button className="memory-button memory-button--ghost" onClick={() => setModalOpen(false)}>
                {t('cancel')}
              </button>
              <button className="memory-button memory-button--primary" onClick={() => void saveMemory()} disabled={saving}>
                {saving ? '...' : t('save')}
              </button>
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
    if (!document.body) return false
    container = document.createElement('div')
    container.id = 'root'
    document.body.appendChild(container)
  }
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <MemoryApp />
    </React.StrictMode>,
  )
  return true
}

if (!mount()) {
  window.addEventListener('DOMContentLoaded', () => void mount(), { once: true })
}
