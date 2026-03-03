import type { PiDiagnostics } from '@/features/workspace/types'

export function DiagnosticsSection({ diagnostics, onRefresh }: { diagnostics: PiDiagnostics | null; onRefresh: () => void }) {
  return (
    <section className="settings-card">
      {diagnostics ? (
        <>
          <div className="settings-card-note">Pi: <span className="settings-mono">{diagnostics.piPath}</span></div>
          <div className="settings-card-note">Settings: <span className="settings-mono">{diagnostics.settingsPath}</span></div>
          <div className="settings-card-note">Models: <span className="settings-mono">{diagnostics.modelsPath}</span></div>
          <div className="settings-list">
            {diagnostics.checks.map((check) => (
              <div key={check.id} className={`settings-check settings-check-${check.level}`}>{check.message}</div>
            ))}
          </div>
        </>
      ) : (
        <div className="settings-card-note">Chargement diagnostics...</div>
      )}
      <button type="button" className="settings-action" onClick={onRefresh}>Rafraîchir</button>
    </section>
  )
}
