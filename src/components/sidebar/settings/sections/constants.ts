export const SETTINGS_SECTIONS = [
  'general',
  'language',
  'models',
  'providers',
  'packages',
  'tools',
  'sessions',
  'commands',
  'diagnostics',
] as const

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]

export const SECTION_LABELS: Record<SettingsSection, string> = {
  general: 'Général',
  language: 'Langue',
  models: 'Modèles',
  providers: 'Providers',
  packages: 'Packages & Extensions',
  tools: 'Outils & Exécution',
  sessions: 'Sessions & Export',
  commands: 'Commandes Pi',
  diagnostics: 'Diagnostic',
}
