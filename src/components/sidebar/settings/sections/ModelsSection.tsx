import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ProvidersModelsSection } from './ProvidersModelsSection'
import { MemoryModelPicker } from '@/components/model/MemoryModelPicker'
import { TitleModelPicker } from '@/components/model/TitleModelPicker'
import { AutocompleteModelPicker } from '@/components/model/AutocompleteModelPicker'
import { workspaceIpc } from '@/services/ipc/workspace'

type ModelTab = 'providers' | 'memory' | 'autocomplete' | 'title'

type PiModel = { id: string; provider: string; key: string; scoped: boolean }

export function ModelsSection({
  modelsJson,
  setModelsJson,
  onProviderConnected,
}: {
  modelsJson: Parameters<typeof ProvidersModelsSection>[0]['modelsJson']
  setModelsJson: Parameters<typeof ProvidersModelsSection>[0]['setModelsJson']
  onProviderConnected?: () => void
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ModelTab>('providers')
  const [models, setModels] = useState<PiModel[]>([])
  const [memoryModelKey, setMemoryModelKey] = useState<string | null>(null)
  const [titleModelKey, setTitleModelKey] = useState<string | null>(null)
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(false)
  const [autocompleteModelKey, setAutocompleteModelKey] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load model lists and preferences
  useEffect(() => {
    void (async () => {
      try {
        const [modelsResult, memoryResult, titleResult, autocompleteResult] = await Promise.all([
          workspaceIpc.listPiModels(),
          workspaceIpc.getMemoryModelPreference(),
          workspaceIpc.getTitleModelPreference(),
          workspaceIpc.getAutocompleteModelPreference(),
        ])
        
        if (modelsResult.ok) {
          setModels(modelsResult.models)
        }
        if (memoryResult.ok) {
          setMemoryModelKey(memoryResult.modelKey)
        }
        if (titleResult.ok) {
          setTitleModelKey(titleResult.modelKey)
        }
        if (autocompleteResult.ok) {
          setAutocompleteEnabled(autocompleteResult.enabled)
          setAutocompleteModelKey(autocompleteResult.modelKey)
        }
      } catch {
        // Ignore
      } finally {
        setLoaded(true)
      }
    })()
  }, [])

  const tabs: { id: ModelTab; label: string }[] = [
    { id: 'providers', label: t('Providers') },
    { id: 'memory', label: t('Mémoire') },
    { id: 'autocomplete', label: t('Auto-complete') },
    { id: 'title', label: t('Titres') },
  ]

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">
      {/* Tab navigation */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-black/10 pb-3 dark:border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#2563eb] text-white dark:bg-[#3b82f6]'
                : 'bg-black/[0.04] text-[#374151] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-[#d1d5db] dark:hover:bg-white/[0.1]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Providers tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <ProvidersModelsSection
            modelsJson={modelsJson}
            setModelsJson={setModelsJson}
            models={models}
            onProviderConnected={onProviderConnected}
            onToggleScope={async (model) => {
              const result = await workspaceIpc.setPiModelScoped(
                model.provider,
                model.id,
                !model.scoped,
              )
              if (!result.ok) {
                return
              }
              // Trigger re-render by updating parent
              await onProviderConnected?.()
            }}
          />
        </div>
      )}

      {/* Memory model tab */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb]">
            {t('settings.memory.title')}
          </h4>
          <div className="mb-3 text-sm text-[#6b7280] dark:text-[#9ca3af]">
            {t('settings.memory.desc')}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#374151] dark:text-[#d1d5db]">
              {t('settings.memory.modelLabel')}
            </span>
            {loaded ? (
              <MemoryModelPicker
                modelKey={memoryModelKey}
                onChange={(modelKey) => {
                  setMemoryModelKey(modelKey)
                  void workspaceIpc.setMemoryModelPreference(modelKey)
                }}
              />
            ) : (
              <div className="text-sm text-[#9ca3af] dark:text-[#6b7280]">{t('Chargement...')}</div>
            )}
          </div>
        </div>
      )}

      {/* Autocomplete model tab */}
      {activeTab === 'autocomplete' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb]">
            {t('settings.autocomplete.title')}
          </h4>
          <div className="mb-3 text-sm text-[#6b7280] dark:text-[#9ca3af]">
            {t('settings.autocomplete.desc')}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {loaded ? (
              <AutocompleteModelPicker
                enabled={autocompleteEnabled}
                modelKey={autocompleteModelKey}
                onEnabledChange={(enabled) => {
                  setAutocompleteEnabled(enabled)
                  void workspaceIpc.setAutocompleteModelPreference(enabled, autocompleteModelKey)
                }}
                onModelChange={(modelKey) => {
                  setAutocompleteModelKey(modelKey)
                  void workspaceIpc.setAutocompleteModelPreference(autocompleteEnabled, modelKey)
                }}
              />
            ) : (
              <div className="text-sm text-[#9ca3af] dark:text-[#6b7280]">{t('Chargement...')}</div>
            )}
          </div>
        </div>
      )}

      {/* Title model tab */}
      {activeTab === 'title' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb]">
            {t('settings.title.title')}
          </h4>
          <div className="mb-3 text-sm text-[#6b7280] dark:text-[#9ca3af]">
            {t('settings.title.desc')}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#374151] dark:text-[#d1d5db]">
              {t('settings.title.modelLabel')}
            </span>
            {loaded ? (
              <TitleModelPicker
                modelKey={titleModelKey}
                onChange={(modelKey) => {
                  setTitleModelKey(modelKey)
                  void workspaceIpc.setTitleModelPreference(modelKey)
                }}
              />
            ) : (
              <div className="text-sm text-[#9ca3af] dark:text-[#6b7280]">{t('Chargement...')}</div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
