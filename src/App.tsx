import {
  ChevronDown,
  CircleDashed,
  Command,
  Folder,
  FolderPlus,
  Gauge,
  MessageSquarePlus,
  Minus,
  PanelRightOpen,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  SquarePen,
  Workflow,
} from 'lucide-react'
import {
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const folders = ['.rho', 'multicodex-proxy', 'price-tracker', 'thibaut', 'even-travel-companion', 'even-stars', 'pixatwin']

const threads = [
  'Ajouter upload icône projet',
  'Uniformiser transparence ...',
  'Ajuster largeur panneau e...',
  'Animer fermeture détails f...',
  'Changer fond panneaux vi...',
  'Créer composant menu sk...',
  'Corriger disparition dessi...',
  'Utiliser icône édition parc...',
  'Restructurer donnees ong...',
  'Rendre fond loader viewe...',
]

const suggestions = [
  { icon: '🎮', text: 'Build a classic Snake game in this repo.' },
  { icon: '🧾', text: 'Create a one-page $pdf that summarizes this app.' },
  { icon: '✏️', text: 'Create a plan to...' },
]

const SIDEBAR_MIN_WIDTH = 260
const SIDEBAR_MAX_WIDTH = 460
const SIDEBAR_DEFAULT_WIDTH = 320
const SIDEBAR_RESIZE_STEP = 16

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH)

  useEffect(() => {
    if (!isResizing) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const delta = event.clientX - resizeStartXRef.current
      const nextWidth = clamp(
        resizeStartWidthRef.current + delta,
        SIDEBAR_MIN_WIDTH,
        SIDEBAR_MAX_WIDTH,
      )
      setSidebarWidth(nextWidth)
    }

    const handlePointerUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing])

  const handleSidebarResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    resizeStartXRef.current = event.clientX
    resizeStartWidthRef.current = sidebarWidth
    setIsResizing(true)
  }

  const handleSidebarResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSidebarWidth((width) => clamp(width - SIDEBAR_RESIZE_STEP, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSidebarWidth((width) => clamp(width + SIDEBAR_RESIZE_STEP, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
    }
  }

  return (
    <div className={`app-shell ${isResizing ? 'is-resizing' : ''}`}>
      <div className="app-layout">
        <aside className="sidebar-panel" style={{ width: `${sidebarWidth}px` }}>
          <div className="sidebar-nav">
            <SidebarItem icon={SquarePen} label="Nouveau fil" />
            <SidebarItem icon={Gauge} label="Automatisations" />
            <SidebarItem icon={Workflow} label="Compétences" />
          </div>

          <div className="sidebar-section-head">
            <span className="sidebar-section-title">Fils</span>
            <div className="flex items-center gap-3">
              <SidebarIconButton icon={FolderPlus} label="Ajouter un dossier" />
              <SidebarIconButton icon={Minus} label="Replier la section" />
            </div>
          </div>

          <div className="sidebar-scroll">
            <div className="space-y-0.5">
              {folders.map((folder) => (
                <button key={folder} type="button" className="folder-row">
                  <Folder className="h-4 w-4 text-[#6f7076]" />
                  <span className="truncate">{folder}</span>
                </button>
              ))}
            </div>

            <div className="sidebar-thread-list">
              {threads.map((thread) => (
                <ThreadRow key={thread} title={thread} />
              ))}
              <button type="button" className="show-more-row">
                Afficher plus
              </button>
            </div>
          </div>

          <div className="border-t border-[#dcdddf] px-3 py-3">
            <button type="button" className="sidebar-item text-[#45464d]">
              <Settings className="h-4 w-4" />
              Paramètres
            </button>
          </div>
        </aside>

        <div
          className="sidebar-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la barre latérale"
          tabIndex={0}
          onPointerDown={handleSidebarResizeStart}
          onKeyDown={handleSidebarResizeKeyDown}
        />

        <main className="main-panel">
          <header className="topbar">
            <div className="topbar-title">Nouveau fil</div>

            <div className="flex items-center gap-2">
              <TopPill icon={Command} label="Ouvrir" />
              <TopPill icon={CircleDashed} label="Validation" muted />
              <IconBtn icon={PanelRightOpen} />
              <IconBtn icon={MessageSquarePlus} />
              <IconBtn icon={Pencil} />
            </div>
          </header>

          <div className="main-scroll">
            <section className="hero-section">
              <div className="hero-group">
                <div className="hero-icon-wrap">
                  <Sparkles className="h-5 w-5 text-[#17181d]" />
                </div>
                <h1 className="hero-title">Créons ensemble</h1>
                <button type="button" className="hero-subtitle">
                  pixatwin <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </section>

            <section className="content-wrap suggestion-section">
              <div className="explore-label">Explore more</div>
              <div className="suggestions-grid">
                {suggestions.map((suggestion) => (
                  <button key={suggestion.text} type="button" className="suggestion-card">
                    <div className="mb-2.5 text-lg">{suggestion.icon}</div>
                    <p className="suggestion-copy">{suggestion.text}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <footer className="composer-footer">
            <div className="content-wrap">
              <div className="composer-shell">
                <Input
                  placeholder="Demandez n’importe quoi à Codex, utilisez @ pour ajouter des fichiers, / pour les commandes"
                  className="composer-input"
                />

                <div className="composer-meta">
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-[#696b73]">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Badge variant="secondary" className="meta-chip">
                      GPT-5.3-Codex <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    </Badge>
                    <Badge variant="secondary" className="meta-chip">
                      Élevé <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    </Badge>
                  </div>

                  <Button type="button" size="icon" className="send-button">
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>

              <div className="status-row">
                <StatusButton label="▭ Local" />
                <StatusButton label="◌ Accès complet" warning />
                <StatusButton label="⌘ main" />
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

function SidebarIconButton({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button type="button" className="sidebar-icon-button" aria-label={label}>
      <Icon className="h-4 w-4" />
    </button>
  )
}

function StatusButton({ label, warning = false }: { label: string; warning?: boolean }) {
  return (
    <button type="button" className={`status-button ${warning ? 'status-button-warning' : ''}`}>
      <span>{label}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  )
}

function SidebarItem({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button type="button" className="sidebar-item">
      <Icon className="h-4 w-4 text-[#66676f]" />
      {label}
    </button>
  )
}

function ThreadRow({ title }: { title: string }) {
  return (
    <button type="button" className="thread-row">
      <span className="thread-row-title">{title}</span>
      <span className="thread-row-meta">1 h</span>
    </button>
  )
}

function TopPill({
  icon: Icon,
  label,
  muted = false,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  muted?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={`top-pill ${muted ? 'top-pill-muted' : 'top-pill-default'}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </Button>
  )
}

function IconBtn({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="icon-button">
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export default App
