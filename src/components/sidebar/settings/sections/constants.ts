export const SETTINGS_SECTIONS = [
  'appearance',
  'behavior',
  'models',
  'audio',
  'sessions',
  'advanced',
] as const

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]

export const SECTION_LABELS: Record<SettingsSection, string> = {
  appearance: 'Apparence',
  behavior: 'Comportement',
  models: 'Modèles',
  audio: 'Audio',
  sessions: 'Sessions',
  advanced: 'Avancé',
}
