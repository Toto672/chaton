import type { PiSettingsJson } from '@/features/workspace/types'

export function ToolsSection({
  settings,
  setSettings,
  onSave,
}: {
  settings: PiSettingsJson
  setSettings: (next: PiSettingsJson) => void
  onSave: () => void
}) {
  return (
    <section className="settings-card">
      <h3 className="settings-card-title">Outils & Exécution</h3>
      <label className="settings-row-wrap">
        <span className="settings-label">defaultTools (CSV)</span>
        <input
          className="settings-input"
          value={String((settings.defaultTools as string[] | undefined)?.join(',') ?? '')}
          onChange={(e) => setSettings({ ...settings, defaultTools: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
        />
      </label>
      {['extensionsEnabled', 'skillsEnabled', 'promptTemplatesEnabled', 'themesEnabled', 'offlineMode'].map((key) => (
        <label className="settings-toggle-row" key={key}>
          <span className="settings-label">{key}</span>
          <input
            type="checkbox"
            checked={Boolean(settings[key])}
            onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
          />
        </label>
      ))}
      <button type="button" className="settings-action" onClick={onSave}>Sauvegarder</button>
    </section>
  )
}
