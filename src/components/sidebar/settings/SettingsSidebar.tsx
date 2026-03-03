import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useWorkspace } from '@/features/workspace/store'
import { workspaceIpc } from '@/services/ipc/workspace'
import type { PiCommandResult, PiConfigSnapshot, PiDiagnostics, PiModelsJson, PiSettingsJson } from '@/features/workspace/types'

import { SettingsNav } from './SettingsNav'
import { CommandsSection } from './sections/CommandsSection'
import { DiagnosticsSection } from './sections/DiagnosticsSection'
import { GeneralSection } from './sections/GeneralSection'
import { ModelsSection } from './sections/ModelsSection'
import { PackagesSection } from './sections/PackagesSection'
import { ProvidersSection } from './sections/ProvidersSection'
import { SessionsSection } from './sections/SessionsSection'
import type { SettingsSection } from './sections/constants'
import { ToolsSection } from './sections/ToolsSection'

export function SettingsSidebar() {
  const {
    closeSettings,
    getPiConfig,
    getPiDiagnostics,
    savePiModelsPatch,
    savePiSettingsPatch,
    setNotice,
    runPiCommand,
    openPiPath,
    exportPiSessionHtml,
  } = useWorkspace()

  const [active, setActive] = useState<SettingsSection>('general')
  const [snapshot, setSnapshot] = useState<PiConfigSnapshot | null>(null)
  const [settingsJson, setSettingsJson] = useState<PiSettingsJson>({})
  const [modelsJson, setModelsJson] = useState<PiModelsJson>({})
  const [models, setModels] = useState<Array<{ id: string; provider: string; key: string; scoped: boolean }>>([])
  const [diagnostics, setDiagnostics] = useState<PiDiagnostics | null>(null)
  const [lastResult, setLastResult] = useState<PiCommandResult | null>(null)

  const sessionDir = useMemo(() => String(settingsJson.sessionDir ?? ''), [settingsJson])

  const refresh = async () => {
    const config = await getPiConfig()
    setSnapshot(config)
    setSettingsJson((config.settings ?? {}) as PiSettingsJson)
    setModelsJson((config.models ?? {}) as PiModelsJson)
    const listRes = await runPiCommand('list-models')
    setLastResult(listRes)
    if (listRes.ok) {
      const rows = listRes.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('provider'))
        .map((line) => {
          const parts = line.split(/\s{2,}/)
          const provider = parts[0]
          const id = parts[1]
          const key = `${provider}/${id}`
          const enabled = Array.isArray((config.settings ?? {}).enabledModels)
            ? ((config.settings ?? {}).enabledModels as unknown[]).includes(key)
            : false
          return { provider, id, key, scoped: enabled }
        })
      setModels(rows)
    }
    const nextDiag = await getPiDiagnostics()
    setDiagnostics(nextDiag)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const saveSettings = async () => {
    const result = await savePiSettingsPatch(settingsJson)
    if (!result.ok) {
      setNotice(result.message)
      return
    }
    setNotice('settings.json sauvegardé.')
    await refresh()
  }

  const saveModels = async () => {
    const result = await savePiModelsPatch(modelsJson)
    if (!result.ok) {
      setNotice(result.message)
      return
    }
    setNotice('models.json sauvegardé.')
    await refresh()
  }

  return (
    <div className="settings-sidebar">
      <div className="settings-head">
        <button type="button" className="sidebar-item" onClick={closeSettings}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="settings-head-title">Paramètres Pi</div>
      </div>

      <SettingsNav active={active} onChange={setActive} />

      <div className="settings-content">
        {active === 'general' ? <GeneralSection settings={settingsJson} setSettings={setSettingsJson} onSave={saveSettings} /> : null}
        {active === 'models' ? (
          <ModelsSection
            settings={settingsJson}
            models={models}
            setSettings={setSettingsJson}
            onToggle={async (provider, id, scoped) => {
              const result = await workspaceIpc.setPiModelScoped(provider, id, !scoped)
              if (!result.ok) {
                setNotice(result.message ?? 'Impossible de modifier le scope du modèle.')
                return
              }
              setModels(result.models)
              const scopedKeys = result.models.filter((item) => item.scoped).map((item) => item.key)
              setSettingsJson({ ...settingsJson, enabledModels: scopedKeys })
            }}
            onSave={saveSettings}
          />
        ) : null}
        {active === 'providers' ? <ProvidersSection models={modelsJson} setModels={setModelsJson} onSave={saveModels} /> : null}
        {active === 'packages' ? <PackagesSection settings={settingsJson} setSettings={setSettingsJson} onSave={saveSettings} /> : null}
        {active === 'tools' ? <ToolsSection settings={settingsJson} setSettings={setSettingsJson} onSave={saveSettings} /> : null}
        {active === 'sessions' ? (
          <SessionsSection
            sessionDir={sessionDir}
            openSessions={() => {
              void openPiPath('sessions')
            }}
            exportSession={(session, output) => {
              void exportPiSessionHtml(session, output).then((result) => setLastResult(result))
            }}
          />
        ) : null}
        {active === 'commands' ? (
          <CommandsSection
            lastResult={lastResult}
            onRun={(action, params) => {
              void runPiCommand(action, params).then((result) => setLastResult(result))
            }}
          />
        ) : null}
        {active === 'diagnostics' ? <DiagnosticsSection diagnostics={diagnostics} onRefresh={() => void refresh()} /> : null}
        {snapshot?.errors?.length ? <div className="settings-error">{snapshot.errors.join(' | ')}</div> : null}
      </div>
    </div>
  )
}
