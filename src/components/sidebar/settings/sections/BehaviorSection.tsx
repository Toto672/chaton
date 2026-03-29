import { useTranslation } from 'react-i18next'

import type { SidebarSettings } from '@/features/workspace/types'

type Props = {
  settings: SidebarSettings
  setSettings: (next: SidebarSettings) => void
  onSave: () => void
}

export function BehaviorSection({ settings, setSettings, onSave }: Props) {
  const { t } = useTranslation()

  return (
    <section className="space-y-4 rounded-2xl border border-[#dcdddf] bg-[#f7f7f9] p-5 dark:border-[#262934] dark:bg-[#151821]">
      <h3 className="text-base font-semibold text-[#1e1f26] dark:text-[#f3f4f6]">{t('Comportement')}</h3>

      {/* Prompt système */}
      <div className="mb-3 text-sm text-[#6b7280] dark:text-[#9ca3af]">
        {t('Prompt appliqué automatiquement au début de chaque message utilisateur.')}
      </div>
      <label className="block space-y-1">
        <textarea
          className="w-full rounded-lg border border-[#d4d5da] bg-white px-3 py-2 text-sm text-[#2d2f35] transition-colors focus:border-[#b5b8c2] focus:outline-none focus:ring-2 focus:ring-[#b9bac1]/40 dark:border-[#343845] dark:bg-[#0f1218] dark:text-[#e5e7eb]"
          rows={12}
          value={String(settings.defaultBehaviorPrompt ?? '')}
          onChange={(e) =>
            setSettings({ ...settings, defaultBehaviorPrompt: e.target.value })
          }
          placeholder={t('Entrez votre prompt système...')}
        />
      </label>

      <button type="button" className="mt-4 rounded-lg border border-[#cacbd1] bg-white px-3 py-2 text-sm font-medium text-[#3b3d45] transition-colors hover:bg-[#f2f2f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9bac1] dark:border-[#343845] dark:bg-[#0f1218] dark:text-[#e5e7eb] dark:hover:bg-[#161b24]" onClick={onSave}>
        {t('Sauvegarder')}
      </button>
    </section>
  )
}
