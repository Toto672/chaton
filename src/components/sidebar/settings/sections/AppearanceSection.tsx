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
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9bac1] focus-visible:ring-offset-2 ${checked ? 'bg-[#3967d6]' : 'bg-[#d1d3da]'}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
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
    <section className="space-y-4 rounded-2xl border border-[#dcdddf] bg-[#f7f7f9] p-5 dark:border-[#262934] dark:bg-[#151821]">
      <h3 className="text-base font-semibold text-[#1e1f26] dark:text-[#f3f4f6]">{t('Apparence')}</h3>
      <div className="space-y-3">
        {/* Theme */}
        <label className="block space-y-1">
          <span className="text-xs text-[#696b74] dark:text-[#9ca3af]">{t('Thème')}</span>
          <select
            className="w-full rounded-lg border border-[#d4d5da] bg-white px-3 py-2 text-sm text-[#2d2f35] transition-colors focus:border-[#b5b8c2] focus:outline-none focus:ring-2 focus:ring-[#b9bac1]/40 dark:border-[#343845] dark:bg-[#0f1218] dark:text-[#e5e7eb]"
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
        <label className="block space-y-1">
          <span className="text-xs text-[#696b74] dark:text-[#9ca3af]">{t('Langue')}</span>
          <select
            className="w-full rounded-lg border border-[#d4d5da] bg-white px-3 py-2 text-sm text-[#2d2f35] transition-colors focus:border-[#b5b8c2] focus:outline-none focus:ring-2 focus:ring-[#b9bac1]/40 dark:border-[#343845] dark:bg-[#0f1218] dark:text-[#e5e7eb]"
            value={i18n.language}
            onChange={handleLanguageChange}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        {/* Sidebar toggles */}
        <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-white/5">
          <span className="text-xs text-[#696b74] dark:text-[#9ca3af]">
            {t('Afficher les stats assistant')}
          </span>
          <Toggle
            checked={Boolean(sidebarSettings.showAssistantStats)}
            onChange={(v) =>
              setSidebarSettings({ ...sidebarSettings, showAssistantStats: v })
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-white/5">
          <span className="text-xs text-[#696b74] dark:text-[#9ca3af]">
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

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border border-[#cacbd1] bg-white px-3 py-2 text-sm font-medium text-[#3b3d45] transition-colors hover:bg-[#f2f2f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9bac1] dark:border-[#343845] dark:bg-[#0f1218] dark:text-[#e5e7eb] dark:hover:bg-[#161b24]" onClick={onSaveSidebar}>
          {t('Sauvegarder')}
        </button>
        <button type="button" className="rounded-lg border border-[#d9dadf] bg-[#f5f5f7] px-3 py-2 text-sm font-medium text-[#3b3d45] transition-colors hover:border-[#cacbd1] hover:bg-[#ececf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9bac1] dark:border-[#343845] dark:bg-[#171b24] dark:text-[#e5e7eb] dark:hover:bg-[#1d2330]" onClick={onSaveSettingsJson}>
          {t('Sauvegarder Pi')}
        </button>
      </div>
    </section>
  )
}
