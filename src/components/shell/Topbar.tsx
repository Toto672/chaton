import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/features/workspace/store'

function TopPill({ label, chime = false }: { label: string; chime?: boolean }) {
  return (
    <Button type="button" variant="outline" className={`top-pill top-pill-default ${chime ? 'top-pill-chime' : ''}`}>
      <span>{label}</span>
    </Button>
  )
}

export function Topbar() {
  const { state } = useWorkspace()

  if (state.sidebarMode === 'settings') {
    return null
  }

  const selectedConversation = state.conversations.find((conversation) => conversation.id === state.selectedConversationId)
  const runtime = selectedConversation ? state.piByConversation[selectedConversation.id] : null
  const shouldShowRuntimePills = Boolean(runtime && (runtime.status !== 'stopped' || runtime.pendingCommands > 0 || runtime.lastError))
  const shouldShowStatusPill = Boolean(runtime && runtime.status !== 'stopped' && runtime.status !== 'starting')

  return (
    <header className="topbar">
      <div className="topbar-title">{selectedConversation?.title ?? 'Nouveau fil'}</div>

      <div className="flex items-center gap-2">
        {shouldShowStatusPill ? <TopPill label={`Pi ${runtime?.status}`} /> : null}
        {shouldShowRuntimePills ? <TopPill label={`Queue ${runtime?.pendingCommands ?? 0}`} /> : null}
      </div>
    </header>
  )
}
