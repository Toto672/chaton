import type { PiSettingsJson } from '@/features/workspace/types'

type Props = {
  settings: PiSettingsJson
  setSettings: (next: PiSettingsJson) => void
  onSave: () => void
}

function setPath(obj: PiSettingsJson, path: string[], value: unknown) {
  const next: PiSettingsJson = { ...obj }
  let node: Record<string, unknown> = next
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    const current = node[key]
    node[key] = current && typeof current === 'object' && !Array.isArray(current) ? { ...(current as Record<string, unknown>) } : {}
    node = node[key] as Record<string, unknown>
  }
  node[path[path.length - 1]] = value
  return next
}

export function GeneralSection({ settings, setSettings, onSave }: Props) {
  const textFields: Array<{ key: string; value: string }> = [
    { key: 'defaultProvider', value: String(settings.defaultProvider ?? '') },
    { key: 'defaultModel', value: String(settings.defaultModel ?? '') },
    { key: 'defaultThinkingLevel', value: String(settings.defaultThinkingLevel ?? '') },
    { key: 'theme', value: String(settings.theme ?? '') },
    { key: 'doubleEscapeAction', value: String(settings.doubleEscapeAction ?? '') },
    { key: 'steeringMode', value: String(settings.steeringMode ?? '') },
  ]
  const boolFields: Array<{ key: string; value: boolean }> = [
    { key: 'hideThinkingBlock', value: Boolean(settings.hideThinkingBlock) },
    { key: 'quietStartup', value: Boolean(settings.quietStartup) },
    { key: 'collapseChangelog', value: Boolean(settings.collapseChangelog) },
  ]

  return (
    <section className="settings-card">
      <h3 className="settings-card-title">Général</h3>
      <div className="settings-grid">
        {textFields.map(({ key, value }) => (
          <label key={key} className="settings-row-wrap">
            <span className="settings-label">{key}</span>
            <input className="settings-input" value={value} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
          </label>
        ))}
        {boolFields.map(({ key, value }) => (
          <label key={key} className="settings-toggle-row">
            <span className="settings-label">{key}</span>
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
            />
          </label>
        ))}
        <label className="settings-toggle-row">
          <span className="settings-label">terminal.clearOnShrink</span>
          <input
            type="checkbox"
            checked={Boolean((settings.terminal as { clearOnShrink?: boolean } | undefined)?.clearOnShrink)}
            onChange={(e) => setSettings(setPath(settings, ['terminal', 'clearOnShrink'], e.target.checked))}
          />
        </label>
        <label className="settings-toggle-row">
          <span className="settings-label">gpuStatus.enabled</span>
          <input
            type="checkbox"
            checked={Boolean((settings.gpuStatus as { enabled?: boolean } | undefined)?.enabled)}
            onChange={(e) => setSettings(setPath(settings, ['gpuStatus', 'enabled'], e.target.checked))}
          />
        </label>
        <label className="settings-row-wrap">
          <span className="settings-label">gpuStatus.ssh</span>
          <input
            className="settings-input"
            value={String((settings.gpuStatus as { ssh?: string } | undefined)?.ssh ?? '')}
            onChange={(e) => setSettings(setPath(settings, ['gpuStatus', 'ssh'], e.target.value))}
          />
        </label>
      </div>
      <button type="button" className="settings-action" onClick={onSave}>Sauvegarder</button>
    </section>
  )
}
