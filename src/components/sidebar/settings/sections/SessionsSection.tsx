export function SessionsSection({
  sessionDir,
  openSessions,
  exportSession,
}: {
  sessionDir: string
  openSessions: () => void
  exportSession: (session: string, output?: string) => void
}) {
  return (
    <section className="settings-card">
      <div className="settings-card-note">Session dir: <span className="settings-mono">{sessionDir || '~/.pi/agent/sessions'}</span></div>
      <div className="settings-actions-row">
        <button type="button" className="settings-action" onClick={openSessions}>Ouvrir dossier sessions</button>
        <button
          type="button"
          className="settings-action"
          onClick={() => exportSession(`${sessionDir || '~/.pi/agent/sessions'}/dashboard/session.jsonl`)}
        >
          Export HTML (exemple)
        </button>
      </div>
    </section>
  )
}
