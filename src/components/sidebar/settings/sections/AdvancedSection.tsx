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
    <section className="settings-card">
      {/* Tab navigation */}
      <div className="settings-tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`settings-tab-btn ${activeTab === tab.id ? 'settings-tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span style={{ marginLeft: '6px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Diagnostics tab */}
      {activeTab === 'diagnostics' && (
        <div className="settings-tab-content">
          <h3 className="settings-card-title">{t('Diagnostic')}</h3>
          {diagnostics ? (
            <>
              <div className="settings-card-note">
                Pi: <span className="settings-mono">{diagnostics.piPath}</span>
              </div>
              <div className="settings-card-note">
                Settings:{' '}
                <span className="settings-mono">{diagnostics.settingsPath}</span>
              </div>
              <div className="settings-card-note">
                Models:{' '}
                <span className="settings-mono">{diagnostics.modelsPath}</span>
              </div>
              <div className="settings-list" style={{ marginTop: '16px' }}>
                {diagnostics.checks
                  .filter((check) => check.id !== 'pi-binary-not-found')
                  .map((check) => (
                    <div
                      key={check.id}
                      className={`settings-check settings-check-${check.level}`}
                    >
                      {check.message}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="settings-card-note">{t('Chargement diagnostics...')}</div>
          )}
        </div>
      )}

      {/* CLI tab */}
      {activeTab === 'cli' && (
        <div className="settings-tab-content">
          <h3 className="settings-card-title">Pi CLI</h3>
          <CommandOutputPanel result={lastResult} />
        </div>
      )}
    </section>
  )
}
