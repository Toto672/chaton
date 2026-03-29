import { SecretInput } from '@/components/sidebar/settings/SecretInput'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { workspaceIpc } from '@/services/ipc/workspace'

import type { PiModelsJson } from '@/features/workspace/types'

export function ProvidersSection({
  models,
  setModels,
  onSave,
}: {
  models: PiModelsJson
  setModels: (next: PiModelsJson) => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  const providers = ((models.providers ?? {}) as Record<string, unknown>)
  const [refreshingProvider, setRefreshingProvider] = useState<string | null>(null)
  const [discoveryStatus, setDiscoveryStatus] = useState<Record<string, { ok: boolean; message?: string }>>({})
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<Record<string, { ok: boolean; message?: string; latency?: number }>>({})

  const handleRefreshModels = async (providerName: string) => {
    setRefreshingProvider(providerName)
    setDiscoveryStatus({})
    try {
      const provider = (providers[providerName] ?? {}) as Record<string, unknown>
      const result = await workspaceIpc.discoverProviderModels(provider, providerName)
      
      if (result.ok && result.models.length > 0) {
        // Update models.json with discovered models
        const discoveredModelsList = result.models.map((model) => {
          const entry: Record<string, unknown> = { id: model.id }
          if (typeof model.contextWindow === 'number' && model.contextWindowSource === 'provider') {
            entry.contextWindow = model.contextWindow
          }
          if (typeof model.maxTokens === 'number') {
            entry.maxTokens = model.maxTokens
          }
          if (model.reasoning) {
            entry.reasoning = true
          }
          if (model.imageInput) {
            entry.imageInput = true
          }
          return entry
        })

        setModels({
          ...models,
          providers: {
            ...providers,
            [providerName]: {
              ...provider,
              models: discoveredModelsList,
            },
          },
        })

        setDiscoveryStatus({
          [providerName]: {
            ok: true,
            message: `Found ${result.models.length} models`,
          },
        })
      } else {
        setDiscoveryStatus({
          [providerName]: {
            ok: false,
            message: (result as { message?: string }).message || 'No models found',
          },
        })
      }
    } catch (error) {
      setDiscoveryStatus({
        [providerName]: {
          ok: false,
          message: error instanceof Error ? error.message : 'Failed to discover models',
        },
      })
    } finally {
      setRefreshingProvider(null)
    }
  }

  const handleTestConnection = async (providerName: string) => {
    setTestingProvider(providerName)
    setTestStatus({})
    try {
      const provider = (providers[providerName] ?? {}) as Record<string, unknown>
      const currentBaseUrl = typeof provider.baseUrl === 'string' ? provider.baseUrl.trim() : ''
      if (currentBaseUrl) {
        const resolved = await workspaceIpc.resolveProviderBaseUrl(currentBaseUrl)
        if (resolved.ok && resolved.baseUrl && resolved.baseUrl !== currentBaseUrl) {
          setModels({
            ...models,
            providers: {
              ...providers,
              [providerName]: {
                ...provider,
                baseUrl: resolved.baseUrl,
              },
            },
          })
        }
      }
      const result = await workspaceIpc.testProviderConnection(provider)
      
      setTestStatus({
        [providerName]: {
          ok: result.ok,
          message: result.message,
          latency: result.ok ? result.latency : (result as { latency?: number }).latency,
        },
      })
    } catch (error) {
      setTestStatus({
        [providerName]: {
          ok: false,
          message: error instanceof Error ? error.message : 'Failed to test connection',
        },
      })
    } finally {
      setTestingProvider(null)
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      {Object.entries(providers).map(([name, cfg]) => {
        const provider = (cfg ?? {}) as Record<string, unknown>
        const status = discoveryStatus[name]
        const connStatus = testStatus[name]
        return (
          <div
            key={name}
            className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 last:mb-0 dark:border-neutral-800 dark:bg-neutral-900/60"
          >
            <div className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{name}</div>
            <label className="mb-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">api</span>
              <input
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-800"
                value={String(provider.api ?? '')}
                onChange={(e) =>
                  setModels({
                    ...models,
                    providers: { ...providers, [name]: { ...provider, api: e.target.value } },
                  })
                }
              />
            </label>
            <label className="mb-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">baseUrl</span>
              <input
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-800"
                value={String(provider.baseUrl ?? '')}
                onChange={(e) =>
                  setModels({
                    ...models,
                    providers: { ...providers, [name]: { ...provider, baseUrl: e.target.value } },
                  })
                }
              />
            </label>
            <SecretInput
              label="apiKey"
              onApply={(value) =>
                setModels({
                  ...models,
                  providers: { ...providers, [name]: { ...provider, apiKey: value } },
                })
              }
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  onClick={() => handleTestConnection(name)}
                  disabled={testingProvider === name || refreshingProvider === name}
                >
                  {testingProvider === name ? 'Testing...' : 'Ping'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                  onClick={() => handleRefreshModels(name)}
                  disabled={refreshingProvider === name || testingProvider === name}
                >
                  {refreshingProvider === name ? 'Discovering...' : 'Discover Models'}
                </button>
              </div>
            </div>
            {connStatus && (
              <div className="mt-2">
                <div
                  className={connStatus.ok
                    ? 'text-sm text-emerald-700 dark:text-emerald-400'
                    : 'text-sm text-red-700 dark:text-red-400'}
                >
                  <strong>Ping:</strong> {connStatus.message}
                  {connStatus.ok && connStatus.latency !== undefined && ` (${connStatus.latency}ms)`}
                </div>
              </div>
            )}
            {status && (
              <span
                className={status.ok
                  ? 'mt-1 block text-sm text-emerald-700 dark:text-emerald-400'
                  : 'mt-1 block text-sm text-red-700 dark:text-red-400'}
              >
                <strong>Models:</strong> {status.message}
              </span>
            )}
          </div>
        )
      })}
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        onClick={onSave}
      >
        {t('Sauvegarder')}
      </button>
    </section>
  )
}
