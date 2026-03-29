import type { PiSettingsJson } from '@/features/workspace/types'
import { useTranslation } from 'react-i18next'

export function PackagesSection({
  settings,
  setSettings,
  onSave,
}: {
  settings: PiSettingsJson
  setSettings: (next: PiSettingsJson) => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const packages = Array.isArray(settings.packages) ? settings.packages : []
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-2">
        {packages.map((pkg, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <span className="font-mono text-sm text-slate-700 dark:text-slate-200">
              {typeof pkg === 'string' ? pkg : JSON.stringify(pkg)}
            </span>
            <button
              type="button"
              className="text-sm font-medium text-slate-600 transition hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400"
              onClick={() => {
                const next = packages.filter((_, i) => i !== idx)
                setSettings({ ...settings, packages: next })
              }}
            >
              {t('Supprimer')}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        onClick={() => setSettings({ ...settings, packages: [...packages, 'npm:new-package'] })}
      >
        {t('Ajouter package')}
      </button>
      <button
        type="button"
        className="mt-3 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        onClick={onSave}
      >
        {t('Sauvegarder')}
      </button>
    </section>
  )
}
