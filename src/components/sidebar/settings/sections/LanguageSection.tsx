import { useTranslation } from 'react-i18next'

export function LanguageSection({
  currentLanguage,
  setLanguage,
}: {
  currentLanguage: string
  setLanguage: (language: string) => void
}) {
  const { t } = useTranslation()

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value)
  }

  return (
    <section className="settings-card">
      <h3 className="settings-card-title">{t('Langue')}</h3>
      <div className="settings-card-content">
        <div className="settings-form-group">
          <label htmlFor="language-select" className="settings-form-label">
            {t('Sélectionnez la langue')}
          </label>
          <select
            id="language-select"
            className="settings-form-select"
            value={currentLanguage}
            onChange={handleLanguageChange}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </section>
  )
}