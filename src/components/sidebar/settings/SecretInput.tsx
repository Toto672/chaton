import { useState } from 'react'

export function SecretInput({
  label,
  onApply,
}: {
  label: string
  onApply: (value: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <div className="settings-row-wrap">
      <label className="settings-label">{label}</label>
      <div className="settings-secret-row">
        <input
          className="settings-input"
          type="password"
          placeholder="Remplacer la valeur"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          className="settings-action"
          onClick={() => {
            const next = value.trim()
            if (!next) return
            onApply(next)
            setValue('')
          }}
        >
          Appliquer
        </button>
      </div>
    </div>
  )
}
