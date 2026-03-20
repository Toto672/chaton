import { useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'

import type { PiSettingsJson } from '@/features/workspace/types'
import type { SidebarSettings } from '@/features/workspace/types'
import { workspaceIpc } from '@/services/ipc/workspace'

const THEMES = ['system', 'light', 'dark'] as const

type Props = {
  settingsJson: PiSettingsJson
  sidebarSettings: SidebarSettings
  setSettingsJson: (next: PiSettingsJson) => void
  setSidebarSettings: (next: SidebarSettings) => void
  onSaveSettingsJson: () => void
  onSaveSidebar: () => void
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-toggle${checked ? ' settings-toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-thumb" />
    </button>
  )
}

export function AppearanceSection({
  settingsJson,
  sidebarSettings,
  setSettingsJson,
  setSidebarSettings,
  onSaveSettingsJson,
  onSaveSidebar,
}: Props) {
  const { t } = useTranslation()

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value)
    void workspaceIpc.updateLanguagePreference(event.target.value)
  }

  return (
    <section className="settings-card">
      <h3 className="settings-card-title">{t('Apparence')}</h3>
      <div className="settings-grid">
        {/* Theme */}
        <label className="settings-row-wrap">
          <span className="settings-label">{t('Thème')}</span>
          <select
            className="settings-input"
            value={String(settingsJson.theme ?? 'system')}
            onChange={(e) =>
              setSettingsJson({ ...settingsJson, theme: e.target.value })
            }
          >
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme === 'system' ? t('Système') : theme === 'light' ? t('Clair') : t('Sombre')}
              </option>
            ))}
          </select>
        </label>

        {/* Language */}
        <label className="settings-row-wrap">
          <span className="settings-label">{t('Langue')}</span>
          <select
            className="settings-input"
            value={i18n.language}
            onChange={handleLanguageChange}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        {/* Sidebar toggles */}
        <div className="settings-toggle-row">
          <span className="settings-label">
            {t('Afficher les stats assistant')}
          </span>
          <Toggle
            checked={Boolean(sidebarSettings.showAssistantStats)}
            onChange={(v) =>
              setSidebarSettings({ ...sidebarSettings, showAssistantStats: v })
            }
          />
        </div>

        <div className="settings-toggle-row">
          <span className="settings-label">
            {t('Autoriser les logs/crash anonymes')}
          </span>
          <Toggle
            checked={Boolean(sidebarSettings.allowAnonymousTelemetry)}
            onChange={(v) =>
              setSidebarSettings({
                ...sidebarSettings,
                allowAnonymousTelemetry: v,
                telemetryConsentAnswered: true,
              })
            }
          />
        </div>
      </div>

      <div className="settings-actions-row" style={{ marginTop: '16px' }}>
        <button type="button" className="settings-action" onClick={onSaveSidebar}>
          {t('Sauvegarder')}
        </button>
        <button type="button" className="settings-action-secondary" onClick={onSaveSettingsJson}>
          {t('Sauvegarder Pi')}
        </button>
      </div>
    </section>
  )
}
