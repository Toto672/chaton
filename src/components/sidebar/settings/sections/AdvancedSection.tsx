import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Terminal, Activity } from 'lucide-react'

import type { PiCommandResult, PiDiagnostics } from '@/features/workspace/types'
import { CommandOutputPanel } from '@/components/sidebar/settings/CommandOutputPanel'

type AdvancedTab = 'cli' | 'diagnostics'

export function AdvancedSection({
  lastResult,
  diagnostics,
}: {
  lastResult: PiCommandResult | null
  diagnostics: PiDiagnostics | null
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<AdvancedTab>('diagnostics')

  const tabs: { id: AdvancedTab; label: string; icon: React.ReactNode }[] = [
    { id: 'diagnostics', label: t('Diagnostic'), icon: <Activity className="h-4 w-4" /> },
    { id: 'cli', label: t('Pi CLI'), icon: <Terminal className="h-4 w-4" /> },
  ]

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      {/* Tab navigation */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="ml-1.5">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Diagnostics tab */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('Diagnostic')}
          </h3>
          {diagnostics ? (
            <>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Pi: <span className="font-mono text-[13px] text-neutral-900 dark:text-neutral-200">{diagnostics.piPath}</span>
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Settings:{' '}
                <span className="font-mono text-[13px] text-neutral-900 dark:text-neutral-200">{diagnostics.settingsPath}</span>
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Models:{' '}
                <span className="font-mono text-[13px] text-neutral-900 dark:text-neutral-200">{diagnostics.modelsPath}</span>
              </div>
              <div className="mt-4 space-y-2">
                {diagnostics.checks
                  .filter((check) => check.id !== 'pi-binary-not-found')
                  .map((check) => {
                    const levelClasses =
                      check.level === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                        : check.level === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'

                    return (
                      <div
                        key={check.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${levelClasses}`}
                      >
                        {check.message}
                      </div>
                    )
                  })}
              </div>
            </>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('Chargement diagnostics...')}
            </div>
          )}
        </div>
      )}

      {/* CLI tab */}
      {activeTab === 'cli' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Pi CLI</h3>
          <CommandOutputPanel result={lastResult} />
        </div>
      )}
    </section>
  )
}
