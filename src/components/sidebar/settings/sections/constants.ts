export const SETTINGS_SECTIONS = [
  'general',
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
  models: 'Modèles',
  providers: 'Providers',
  packages: 'Packages & Extensions',
  tools: 'Outils & Exécution',
  sessions: 'Sessions & Export',
  commands: 'Commandes Pi',
  diagnostics: 'Diagnostic',
}
