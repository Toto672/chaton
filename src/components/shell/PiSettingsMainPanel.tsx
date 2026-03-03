import { useMemo } from 'react'

import { CommandsSection } from '@/components/sidebar/settings/sections/CommandsSection'
import { DiagnosticsSection } from '@/components/sidebar/settings/sections/DiagnosticsSection'
import { GeneralSection } from '@/components/sidebar/settings/sections/GeneralSection'
import { ModelsSection } from '@/components/sidebar/settings/sections/ModelsSection'
import { PackagesSection } from '@/components/sidebar/settings/sections/PackagesSection'
import { ProvidersSection } from '@/components/sidebar/settings/sections/ProvidersSection'
import { SessionsSection } from '@/components/sidebar/settings/sections/SessionsSection'
import { ToolsSection } from '@/components/sidebar/settings/sections/ToolsSection'
import { useWorkspace } from '@/features/workspace/store'
import { usePiSettingsStore } from '@/features/workspace/pi-settings-store'
import { workspaceIpc } from '@/services/ipc/workspace'

export function PiSettingsMainPanel() {
  const { setNotice, openPiPath, exportPiSessionHtml } = useWorkspace()
  const {
    activeSection,
    snapshot,
    settingsJson,
    setSettingsJson,
    modelsJson,
    setModelsJson,
    models,
    diagnostics,
    lastResult,
    setLastResult,
    refresh,
    saveSettings,
    saveModels,
    runCommand,
  } = usePiSettingsStore()

  const sessionDir = useMemo(() => String(settingsJson.sessionDir ?? ''), [settingsJson])

  const handleSaveSettings = async () => {
    const result = await saveSettings()
    if (!result.ok) {
      setNotice(result.message)
      return
    }
    setNotice('settings.json sauvegardé.')
    await refresh()
  }

  const handleSaveModels = async () => {
    const result = await saveModels()
    if (!result.ok) {
      setNotice(result.message)
      return
    }
    setNotice('models.json sauvegardé.')
    await refresh()
  }

  return (
    <div className="main-scroll">
      <section className="chat-section settings-main-wrap">
        {activeSection === 'general' ? (
          <GeneralSection settings={settingsJson} models={models} setSettings={setSettingsJson} onSave={handleSaveSettings} />
        ) : null}
        {activeSection === 'models' ? (
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
              const scopedKeys = result.models.filter((item) => item.scoped).map((item) => item.key)
              setSettingsJson({ ...settingsJson, enabledModels: scopedKeys })
              await refresh()
            }}
            onSave={handleSaveSettings}
          />
        ) : null}
        {activeSection === 'providers' ? <ProvidersSection models={modelsJson} setModels={setModelsJson} onSave={handleSaveModels} /> : null}
        {activeSection === 'packages' ? <PackagesSection settings={settingsJson} setSettings={setSettingsJson} onSave={handleSaveSettings} /> : null}
        {activeSection === 'tools' ? <ToolsSection settings={settingsJson} setSettings={setSettingsJson} onSave={handleSaveSettings} /> : null}
        {activeSection === 'sessions' ? (
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
        {activeSection === 'commands' ? (
          <CommandsSection
            lastResult={lastResult}
            onRun={(action, params) => {
              void runCommand(action, params).then((result) => setLastResult(result))
            }}
          />
        ) : null}
        {activeSection === 'diagnostics' ? <DiagnosticsSection diagnostics={diagnostics} onRefresh={() => void refresh()} /> : null}
        {snapshot?.errors?.length ? <div className="settings-error">{snapshot.errors.join(' | ')}</div> : null}
      </section>
    </div>
  )
}
