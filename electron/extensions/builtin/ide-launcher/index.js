const widget = document.querySelector('.widget')
const launchButton = document.getElementById('launchButton')
const toggleButton = document.getElementById('toggleButton')
const dropdown = document.getElementById('dropdown')

const VS_CODE_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#0065A9" d="M17.6 2.2 7.4 12l10.2 9.8c.6.5 1.4.1 1.4-.7V2.9c0-.8-.8-1.2-1.4-.7Z"/>
    <path fill="#007ACC" d="M19 4.4 11.2 10.5 6.4 6.8 3.5 8.3l4.6 3.7-4.6 3.7 2.9 1.5 4.8-3.7L19 19.6c.6.5 1.4.1 1.4-.7V5.1c0-.8-.8-1.2-1.4-.7Z"/>
    <path fill="#1F9CF0" d="m14.1 12 4.9-3.8v7.6L14.1 12Z"/>
  </svg>
`

const IDES = [
  { id: 'vs-code', label: 'VS Code', command: 'code', icon: 'svg', svg: VS_CODE_ICON },
  { id: 'cursor', label: 'Cursor', command: 'cursor', icon: 'text', text: 'C' },
  { id: 'windsurf', label: 'Windsurf', command: 'windsurf', icon: 'text', text: 'W' },
  { id: 'jetbrains', label: 'JetBrains IDE', commands: ['idea', 'webstorm', 'pycharm', 'goland', 'phpstorm', 'rubymine', 'clion'], icon: 'text', text: 'J' },
  { id: 'zed', label: 'Zed', command: 'zed', icon: 'text', text: 'Z' },
]

let available = []
let selected = null
let targetPath = null
let projectId = null
let menuOpen = false

function storageKey() {
  return projectId ? `preferred-ide:${projectId}` : null
}

function getIconHtml(ide) {
  if (!ide) return '...'
  if (ide.icon === 'svg') return `<span class="icon icon-svg">${ide.svg}</span>`
  if (ide.icon === 'image') return `<img class="icon-image" src="${ide.image}" alt="${ide.label}" />`
  return `<span class="icon">${ide.text || '?'}</span>`
}

function postVisibilityState() {
  const isVisible = available.length >= 1
  window.parent.postMessage({ type: 'chaton.extension.widgetVisibility', payload: { isVisible } }, '*')
}

function render() {
  const showWidget = available.length >= 1
  const showToggle = available.length >= 2
  if (!showToggle) menuOpen = false

  if (widget) widget.style.display = showWidget ? 'flex' : 'none'
  launchButton.innerHTML = selected ? getIconHtml(selected) : '...'
  launchButton.disabled = !selected || !targetPath
  toggleButton.style.display = showToggle ? 'inline-flex' : 'none'
  dropdown.className = showToggle && menuOpen ? 'dropdown open' : 'dropdown'
  dropdown.innerHTML = available
    .map(
      (ide) => `
        <button class="option ${selected?.id === ide.id ? 'active' : ''}" data-ide-id="${ide.id}" type="button">
          ${getIconHtml(ide)}
          <span>${ide.label}</span>
        </button>
      `,
    )
    .join('')

  postVisibilityState()
}

async function detectIde(ide) {
  if (Array.isArray(ide.commands)) {
    for (const command of ide.commands) {
      try {
        const result = await window.chatons?.workspace?.detectExternalCommand?.(command)
        if (result?.detected) return { ...ide, resolvedCommand: command }
      } catch {}
    }
    return null
  }
  try {
    const result = await window.chatons?.workspace?.detectExternalCommand?.(ide.command)
    if (result?.detected) return { ...ide, resolvedCommand: ide.command }
  } catch {}
  return null
}

async function refresh() {
  const results = await Promise.all(IDES.map(detectIde))
  available = results.filter(Boolean)
  const stored = storageKey() ? window.localStorage.getItem(storageKey()) : null
  selected = available.find((ide) => ide.id === stored) || available[0] || null
  render()
}

async function launchSelected() {
  if (!selected?.resolvedCommand || !targetPath) return
  try {
    const result = await window.chatons?.workspace?.openExternalApplication?.(selected.resolvedCommand, [targetPath])
    if (!result?.success) {
      console.warn(result?.error || `Failed to open ${selected.label}`)
    }
  } catch (error) {
    console.warn('Failed to launch IDE', error)
  }
}

launchButton.addEventListener('click', () => {
  void launchSelected()
})

toggleButton.addEventListener('click', () => {
  if (available.length < 2) return
  menuOpen = !menuOpen
  render()
})

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const option = target.closest('[data-ide-id]')
  if (option) {
    const ideId = option.getAttribute('data-ide-id')
    const next = available.find((ide) => ide.id === ideId)
    if (next) {
      selected = next
      if (storageKey()) window.localStorage.setItem(storageKey(), next.id)
      menuOpen = false
      render()
    }
    return
  }
  if (!target.closest('.widget') && !target.closest('.dropdown')) {
    menuOpen = false
    render()
  }
})

window.addEventListener('message', (event) => {
  const message = event.data
  if (message?.type === 'chaton.extension.topbarContext') {
    const context = message.payload
    const worktreePath = typeof context?.conversation?.worktreePath === 'string' ? context.conversation.worktreePath : null
    const repoPath = typeof context?.project?.repoPath === 'string' ? context.project.repoPath : null
    targetPath = worktreePath || repoPath
    projectId = typeof context?.project?.id === 'string' ? context.project.id : null
    void refresh()
    return
  }
  if (message?.type !== 'chaton.extension.deeplink') return
  const payload = message.payload
  if (!payload) return
  if (payload.target === 'open-selected-ide') {
    void launchSelected()
  }
})

render()
