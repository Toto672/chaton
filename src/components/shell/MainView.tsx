import { AlertCircle, Bot, Loader2, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useWorkspace } from '@/features/workspace/store'
import type { JsonValue } from '@/features/workspace/rpc'

function extractText(value: JsonValue): string {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractText(item)).filter((item) => item.length > 0).join('\n')
  }

  const record = value as Record<string, JsonValue>
  if (typeof record.text === 'string') {
    return record.text
  }

  if (record.content) {
    return extractText(record.content)
  }

  if (record.message) {
    return extractText(record.message)
  }

  return ''
}

function getMessageRole(message: JsonValue): 'user' | 'assistant' | 'system' {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return 'system'
  }

  const root = message as Record<string, JsonValue>
  const maybeRole = root.role
  if (maybeRole === 'user' || maybeRole === 'assistant' || maybeRole === 'system') {
    return maybeRole
  }

  if (root.message && typeof root.message === 'object' && !Array.isArray(root.message)) {
    const nestedRole = (root.message as Record<string, JsonValue>).role
    if (nestedRole === 'user' || nestedRole === 'assistant' || nestedRole === 'system') {
      return nestedRole
    }
  }

  return 'system'
}

function getMessageId(message: JsonValue, index: number): string {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return `msg-${index}`
  }
  const record = message as Record<string, JsonValue>
  return typeof record.id === 'string' ? record.id : `msg-${index}`
}

export function MainView() {
  const { state, respondExtensionUi } = useWorkspace()
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const selectedConversation = state.conversations.find((conversation) => conversation.id === state.selectedConversationId)
  const selectedRuntime = selectedConversation ? state.piByConversation[selectedConversation.id] : null

  const messages = useMemo(() => {
    if (!selectedRuntime?.messages) {
      return []
    }
    return selectedRuntime.messages
  }, [selectedRuntime?.messages])

  useEffect(() => {
    const container = scrollRef.current
    if (!container || !isAtBottom) {
      return
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [isAtBottom, messages, selectedRuntime?.status])

  if (!selectedConversation) {
    return (
      <div className="main-scroll">
        <section className="hero-section">
          <div className="hero-group">
            <h1 className="hero-title">Sélectionnez un fil</h1>
            <div className="hero-subtitle">ou créez-en un depuis la barre latérale</div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div
      className="main-scroll"
      ref={scrollRef}
      onScroll={(event) => {
        const target = event.currentTarget
        const distance = target.scrollHeight - target.scrollTop - target.clientHeight
        setIsAtBottom(distance < 36)
      }}
    >
      <section className="chat-section">
        <div className="chat-status-row">
          <span className={`runtime-pill runtime-pill-${selectedRuntime?.status ?? 'stopped'}`}>
            {selectedRuntime?.status ?? 'stopped'}
          </span>
          {selectedRuntime?.state?.pendingMessageCount ? (
            <span className="runtime-pending-badge">{selectedRuntime.state.pendingMessageCount} en attente</span>
          ) : null}
          {selectedRuntime?.lastError ? (
            <span className="runtime-error-inline">
              <AlertCircle className="h-3.5 w-3.5" /> {selectedRuntime.lastError}
            </span>
          ) : null}
        </div>

        <div className="chat-timeline">
          {messages.length === 0 ? <div className="chat-empty">Aucun message pour le moment.</div> : null}
          {messages.map((message, index) => {
            const id = getMessageId(message, index)
            const role = getMessageRole(message)
            const text = extractText(message)
            return (
              <article key={id} className={`chat-message chat-message-${role}`}>
                <div className="chat-message-icon">{role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}</div>
                <div className="chat-message-body">
                  <div className="chat-message-role">{role}</div>
                  <pre className="chat-message-text">{text || '[message non textuel]'}</pre>
                </div>
              </article>
            )
          })}
        </div>

        {selectedRuntime?.status === 'streaming' ? (
          <div className="chat-streaming-indicator" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" /> Pi répond...
          </div>
        ) : null}
      </section>

      {!isAtBottom ? (
        <button
          type="button"
          className="jump-bottom-button"
          onClick={() => {
            const container = scrollRef.current
            if (!container) return
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
            setIsAtBottom(true)
          }}
        >
          Aller en bas
        </button>
      ) : null}

      {selectedRuntime?.extensionRequests?.[0] ? (
        <div className="extension-modal-backdrop">
          <div className="extension-modal" role="dialog" aria-modal="true">
            <div className="extension-modal-title">{selectedRuntime.extensionRequests[0].method}</div>
            <pre className="extension-modal-content">
              {JSON.stringify(selectedRuntime.extensionRequests[0].payload, null, 2)}
            </pre>
            <div className="extension-modal-actions">
              <button
                type="button"
                className="extension-modal-btn"
                onClick={() =>
                  void respondExtensionUi(selectedConversation.id, {
                    type: 'extension_ui_response',
                    id: selectedRuntime.extensionRequests[0].id,
                    cancelled: true,
                  })
                }
              >
                Annuler
              </button>
              <button
                type="button"
                className="extension-modal-btn extension-modal-btn-primary"
                onClick={() =>
                  void respondExtensionUi(selectedConversation.id, {
                    type: 'extension_ui_response',
                    id: selectedRuntime.extensionRequests[0].id,
                    confirmed: true,
                  })
                }
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
