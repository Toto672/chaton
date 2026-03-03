import { ArrowLeft } from 'lucide-react'

import { useWorkspace } from '@/features/workspace/store'
import { usePiSettingsStore } from '@/features/workspace/pi-settings-store'

import { SettingsNav } from './SettingsNav'

function SettingsSidebarContent() {
  const { closeSettings } = useWorkspace()
  const { activeSection, setActiveSection } = usePiSettingsStore()

  return (
    <div className="settings-sidebar">
      <div className="settings-head">
        <button type="button" className="sidebar-item" onClick={closeSettings}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
      </div>

      <SettingsNav active={activeSection} onChange={setActiveSection} />
    </div>
  )
}

export function SettingsSidebar() {
  return <SettingsSidebarContent />
}
