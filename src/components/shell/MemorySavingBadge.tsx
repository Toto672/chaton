import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { workspaceIpc } from '@/services/ipc/workspace'

type MemorySavingStatus = 'started' | 'completed' | 'skipped' | 'error'

/**
 * Floating badge shown briefly when a conversation capture is saved to memory.
 * Displays temporary status messages then disappears after completion.
 */
export function MemorySavingBadge({ conversationId }: { conversationId: string | null }) {
  const [savingStatus, setSavingStatus] = useState<MemorySavingStatus | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (!conversationId) return

    const unsubSaving = workspaceIpc.onMemorySaving((payload) => {
      if (payload.conversationId !== conversationId) return
      setSavingStatus(payload.status)

      // Auto-dismiss after a delay
      if (payload.status === 'completed' || payload.status === 'skipped' || payload.status === 'error') {
        const timer = setTimeout(() => setSavingStatus(null), 2000)
        return () => clearTimeout(timer)
      }
    })

    return () => {
      unsubSaving()
    }
  }, [conversationId])

  return (
    <AnimatePresence>
      {savingStatus === 'started' && (
        <motion.div
          key="memory-saving-badge"
          className="memory-saving-badge"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Brain className="h-3 w-3 animate-pulse" />
          <span>{t('Saving to memory...')}</span>
        </motion.div>
      )}
      {savingStatus === 'completed' && (
        <motion.div
          key="memory-saved-badge"
          className="memory-saving-badge memory-saving-badge--done"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Brain className="h-3 w-3" />
          <span>{t('Saved to memory')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
