import { ChevronDown, Loader2, Plus, Send, Square, Star } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/features/workspace/store'
import { workspaceIpc } from '@/services/ipc/workspace'

const THINKING_LEVELS: Array<'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'> = [
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
]

function StatusButton({ label, warning = false }: { label: string; warning?: boolean }) {
  return (
    <button type="button" className={`status-button ${warning ? 'status-button-warning' : ''}`}>
      <span>{label}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  )
}

export function Composer() {
  const {
    state,
    createConversationForProject,
    sendPiPrompt,
    setPiModel,
    setPiThinkingLevel,
    stopPi,
    setNotice,
  } = useWorkspace()
  const [message, setMessage] = useState('')
  const [modelsMenuOpen, setModelsMenuOpen] = useState(false)
  const [showAllModels, setShowAllModels] = useState(false)
  const [thinkingMenuOpen, setThinkingMenuOpen] = useState(false)
  const [models, setModels] = useState<Array<{ id: string; provider: string; key: string; scoped: boolean }>>([])
  const [selectedModelKey, setSelectedModelKey] = useState<string>('openai-codex/gpt-5.3-codex')
  const [selectedThinking, setSelectedThinking] = useState<'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'>('medium')
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isUpdatingScope, setIsUpdatingScope] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const modelsMenuRef = useRef<HTMLDivElement | null>(null)
  const selectedConversation = state.conversations.find((conversation) => conversation.id === state.selectedConversationId)
  const selectedRuntime = selectedConversation ? state.piByConversation[selectedConversation.id] : null
  const isDraftConversation = state.selectedProjectId !== null && !selectedConversation

  const handleSendMessage = async () => {
    const nextMessage = message.trim()
    if (!nextMessage || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      let conversationId = selectedConversation?.id

      if (!conversationId) {
        if (!state.selectedProjectId) {
          setNotice('Sélectionnez un projet pour démarrer un fil.')
          return
        }

        const createdConversation = await createConversationForProject(state.selectedProjectId)
        if (!createdConversation) {
          return
        }
        conversationId = createdConversation.id
      }

      await sendPiPrompt({ conversationId, message: nextMessage })
      setMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    void handleSendMessage()
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    const computedStyles = window.getComputedStyle(textarea)
    const lineHeight = parseFloat(computedStyles.lineHeight) || 20
    const maxHeight = lineHeight * 6
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)

    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [message])

  useEffect(() => {
    let mounted = true
    setIsLoadingModels(true)
    workspaceIpc
      .listPiModels()
      .then((result) => {
        if (!mounted) return

        if (!result.ok) {
          setNotice('Impossible de récupérer les modèles Pi.')
          return
        }

        setModels(result.models)
        const scoped = result.models.filter((model) => model.scoped)
        const defaultModel = scoped[0] ?? result.models[0]
        if (defaultModel) {
          setSelectedModelKey(defaultModel.key)
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingModels(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [setNotice])

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      if (!modelsMenuRef.current) return
      if (modelsMenuRef.current.contains(event.target as Node)) return
      setModelsMenuOpen(false)
      setShowAllModels(false)
      setThinkingMenuOpen(false)
    }

    window.addEventListener('mousedown', handleWindowClick)
    return () => window.removeEventListener('mousedown', handleWindowClick)
  }, [])

  useEffect(() => {
    if (!selectedConversation) {
      return
    }

    if (selectedConversation.modelProvider && selectedConversation.modelId) {
      setSelectedModelKey(`${selectedConversation.modelProvider}/${selectedConversation.modelId}`)
    }
    if (selectedConversation.thinkingLevel) {
      const level = selectedConversation.thinkingLevel as typeof selectedThinking
      if (THINKING_LEVELS.includes(level)) {
        setSelectedThinking(level)
      }
    }
  }, [selectedConversation])

  const visibleModels = showAllModels ? models : models.filter((model) => model.scoped)
  const currentModelLabel = models.find((model) => model.key === selectedModelKey)?.id ?? selectedModelKey

  const handleToggleModelScoped = async (model: { id: string; provider: string; scoped: boolean }) => {
    if (isUpdatingScope) return

    setIsUpdatingScope(true)
    const result = await workspaceIpc.setPiModelScoped(model.provider, model.id, !model.scoped)
    setIsUpdatingScope(false)

    if (!result.ok) {
      setNotice('Impossible de modifier le scope du modèle dans Pi.')
      return
    }

    setModels(result.models)
    if (!result.models.some((item) => item.key === selectedModelKey)) {
      const fallback = result.models.find((item) => item.scoped) ?? result.models[0]
      if (fallback) {
        setSelectedModelKey(fallback.key)
      }
    }
  }

  const handleApplyModel = async (modelKey: string) => {
    setSelectedModelKey(modelKey)
    setModelsMenuOpen(false)
    setShowAllModels(false)

    if (!selectedConversation) {
      return
    }

    const [provider, modelId] = modelKey.split('/')
    const response = await setPiModel(selectedConversation.id, provider, modelId)
    if (!response.success) {
      setNotice(response.error ?? 'Impossible de changer de modèle.')
    }
  }

  const handleThinkingChange = async (level: typeof selectedThinking) => {
    setSelectedThinking(level)
    setThinkingMenuOpen(false)

    if (!selectedConversation) {
      return
    }

    const response = await setPiThinkingLevel(selectedConversation.id, level)
    if (!response.success) {
      setNotice(response.error ?? 'Impossible de changer le niveau de réflexion.')
    }
  }

  const isStreaming = Boolean(selectedRuntime?.state?.isStreaming || selectedRuntime?.status === 'streaming')

  return (
    <footer className="composer-footer">
      <div className="content-wrap">
        {state.notice ? (
          <div className="app-notice" role="status" onClick={() => setNotice(null)}>
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
                  ? 'Écrivez votre premier message pour créer ce fil'
                  : 'Sélectionnez un fil pour commencer'
            }
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            className="composer-input"
            rows={1}
          />

          <div className="composer-meta">
            <div className="flex items-center gap-1.5" ref={modelsMenuRef}>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-[#696b73]">
                <Plus className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Badge
                  variant="secondary"
                  className="meta-chip cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setModelsMenuOpen((open) => !open)}
                >
                  {currentModelLabel} <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Badge>

                {modelsMenuOpen ? (
                  <div className="models-menu" role="menu" aria-label="Sélecteur de modèle">
                    <div className="models-menu-list">
                      {isLoadingModels ? (
                        <div className="models-menu-empty">Chargement des modèles...</div>
                      ) : visibleModels.length === 0 ? (
                        <div className="models-menu-empty">
                          {showAllModels ? 'Aucun modèle disponible.' : 'Aucun modèle scoped. Cliquez sur more.'}
                        </div>
                      ) : (
                        visibleModels.map((model) => (
                          <div key={model.key} className="models-menu-row">
                            <button
                              type="button"
                              className={`models-menu-item ${selectedModelKey === model.key ? 'models-menu-item-active' : ''}`}
                              onClick={() => void handleApplyModel(model.key)}
                            >
                              <span>{model.id}</span>
                              <span className="models-menu-provider">{model.provider}</span>
                            </button>
                            {showAllModels ? (
                              <button
                                type="button"
                                className="models-scope-button"
                                aria-label={model.scoped ? 'Retirer du scope' : 'Ajouter au scope'}
                                onClick={() => void handleToggleModelScoped(model)}
                                disabled={isUpdatingScope}
                              >
                                <Star className={`h-3.5 w-3.5 ${model.scoped ? 'fill-current' : ''}`} />
                              </button>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="models-menu-header">
                      <button type="button" className="models-more-button" onClick={() => setShowAllModels((show) => !show)}>
                        {showAllModels ? 'scoped only' : 'more'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <Badge
                  variant="secondary"
                  className="meta-chip cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setThinkingMenuOpen((open) => !open)}
                >
                  thinking:{selectedThinking} <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Badge>
                {thinkingMenuOpen ? (
                  <div className="thinking-menu" role="menu" aria-label="Sélecteur de réflexion">
                    {THINKING_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`thinking-menu-item ${selectedThinking === level ? 'thinking-menu-item-active' : ''}`}
                        onClick={() => void handleThinkingChange(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming && selectedConversation ? (
                <Button
                  type="button"
                  className="send-button"
                  variant="secondary"
                  onClick={() => void stopPi(selectedConversation.id)}
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : null}

              <Button type="button" className="send-button" onClick={() => void handleSendMessage()} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="status-row">
          <StatusButton label={`⌘ ${selectedRuntime?.status ?? 'stopped'}`} warning={selectedRuntime?.status === 'error'} />
        </div>
      </div>
    </footer>
  )
}
