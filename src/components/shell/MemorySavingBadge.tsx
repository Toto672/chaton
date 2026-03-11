import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { workspaceIpc } from '@/services/ipc/workspace'

type MemorySavingStatus = 'started' | 'completed' | 'skipped' | 'error'

/**
 * Floating badge shown briefly when a conversation is auto-saved to memory.
 * Displays "Saving to memory..." then disappears after completion.
 */
export function MemorySavingBadge({ conversationId }: { conversationId: string | null }) {
  const [status, setStatus] = useState<MemorySavingStatus | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const unsub = workspaceIpc.onMemorySaving((payload) => {
      if (payload.conversationId !== conversationId) return
      setStatus(payload.status)

      // Auto-dismiss after a delay
      if (payload.status === 'completed' || payload.status === 'skipped' || payload.status === 'error') {
        const timer = setTimeout(() => setStatus(null), 2000)
        return () => clearTimeout(timer)
      }
    })

    return unsub
  }, [conversationId])

  return (
    <AnimatePresence>
      {status === 'started' && (
        <motion.div
          key="memory-saving-badge"
          className="memory-saving-badge"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Brain className="h-3 w-3 animate-pulse" />
          <span>Saving to memory...</span>
        </motion.div>
      )}
      {status === 'completed' && (
        <motion.div
          key="memory-saved-badge"
          className="memory-saving-badge memory-saving-badge--done"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Brain className="h-3 w-3" />
          <span>Saved to memory</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
