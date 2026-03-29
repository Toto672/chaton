import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2, Keyboard, X } from 'lucide-react'

import { useShortcuts } from '@/hooks/use-shortcuts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ShortcutConfig, ShortcutAction } from '@/services/ipc/shortcuts'

export function ShortcutsSection() {
  const { t } = useTranslation()
  const {
    getAllShortcuts,
    getAllActions,
    updateShortcut,
    saveConfigs
  } = useShortcuts()

  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([])
  const [actions, setActions] = useState<ShortcutAction[]>([])
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    accelerator: '',
    scope: 'foreground' as 'foreground' | 'global',
    enabled: true
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [shortcutsData, actionsData] = await Promise.all([
          getAllShortcuts(),
          getAllActions()
        ])
        setShortcuts(shortcutsData)
        setActions(actionsData)
      } catch (error) {
        console.error('Failed to load shortcuts data:', error)
      }
    }

    void loadData()
  }, [getAllShortcuts, getAllActions])

  const handleEditClick = (shortcut: ShortcutConfig) => {
    setEditingShortcut(shortcut.id)
    setEditData({
      accelerator: shortcut.accelerator,
      scope: shortcut.scope,
      enabled: shortcut.enabled
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingShortcut) return

    try {
      await updateShortcut(editingShortcut, editData)
      await saveConfigs()
      
      // Refresh the data
      const updatedShortcuts = await getAllShortcuts()
      setShortcuts(updatedShortcuts)
      
      setIsDialogOpen(false)
      setEditingShortcut(null)
    } catch (error) {
      console.error('Failed to save shortcut:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const keys: string[] = []
    if (e.ctrlKey) keys.push('Ctrl')
    if (e.metaKey) keys.push('Cmd')
    if (e.shiftKey) keys.push('Shift')
    if (e.altKey) keys.push('Alt')
    
    if (e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Shift' && e.key !== 'Alt') {
      keys.push(e.key)
    }
    
    setRecordedKeys(keys)
    setEditData(prev => ({ ...prev, accelerator: keys.join('+') }))
    setIsRecording(false)
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordedKeys([])
    setEditData(prev => ({ ...prev, accelerator: '' }))
  }

  const getActionName = (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    return action ? action.name : actionId
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <Keyboard className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Raccourcis clavier')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('Gérez les raccourcis clavier pour Chatons')}
        </p>
      </div>

      <div>
        {shortcuts.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            {t('Aucun raccourci configuré')}
          </div>
        ) : (
          <div className="space-y-4">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {getActionName(shortcut.actionId)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {shortcut.scope}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {shortcut.accelerator}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={shortcut.enabled}
                    onChange={async (e) => {
                      const checked = e.target.checked
                      await updateShortcut(shortcut.id, { enabled: checked })
                      await saveConfigs()
                      const updatedShortcuts = await getAllShortcuts()
                      setShortcuts(updatedShortcuts)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-400"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(shortcut)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('Modifier le raccourci')}</h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="accelerator" className="text-right text-sm text-gray-700 dark:text-gray-300">
                    {t('Raccourci')}
                  </label>
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        id="accelerator"
                        value={editData.accelerator}
                        onChange={(e) => 
                          setEditData(prev => ({ ...prev, accelerator: e.target.value }))
                        }
                        onKeyDown={handleKeyDown}
                        placeholder={t('Appuyez sur une touche')}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startRecording}
                        disabled={isRecording}
                      >
                        {isRecording ? t('Enregistrement...') : t('Enregistrer')}
                      </Button>
                    </div>
                    {recordedKeys.length > 0 && (
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {recordedKeys.join(' + ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="scope" className="text-right text-sm text-gray-700 dark:text-gray-300">
                    {t('Portée')}
                  </label>
                  <select
                    id="scope"
                    value={editData.scope}
                    onChange={(e) => 
                      setEditData(prev => ({ ...prev, scope: e.target.value as 'foreground' | 'global' }))
                    }
                    className="col-span-3 rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                  >
                    <option value="foreground">{t('Premier plan (fenêtre active)')}</option>
                    <option value="global">{t('Global (système)')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="enabled" className="text-right text-sm text-gray-700 dark:text-gray-300">
                    {t('Activé')}
                  </label>
                  <div className="col-span-3 flex items-center">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={editData.enabled}
                      onChange={(e) => 
                        setEditData(prev => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('Annuler')}
                </Button>
                <Button onClick={handleSave}>{t('Enregistrer')}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
