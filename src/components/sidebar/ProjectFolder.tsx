import { FolderGit2, X } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'

import { useWorkspace } from '@/features/workspace/store'
import type { Project } from '@/features/workspace/types'

type ProjectFolderProps = {
  projects: Project[]
  extensions?: Array<{ id: string; icon?: string; iconUrl?: string }>
}

export const ProjectFolder = memo(function ProjectFolder({ projects }: ProjectFolderProps) {
  const { t } = useTranslation()
  const { createConversationForProject } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
  const folderRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (
        folderRef.current &&
        !folderRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleProjectClick = useCallback(
    async (projectId: string) => {
      setIsOpen(false)
      await createConversationForProject(projectId)
    },
    [createConversationForProject],
  )

  if (projects.length === 0) return null

  // Show up to 4 mini icons in the row
  const previewCount = Math.min(projects.length, 4)
  const extraCount = projects.length - previewCount

  return (
    <div className="project-folder-container" ref={folderRef}>
      <motion.button
        type="button"
        className="project-folder-row"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={t('{{count}} projets groupes', { count: projects.length })}
        whileTap={{ scale: 0.98 }}
      >
        <span className="project-folder-icons">
          {projects.slice(0, previewCount).map((project, i) => (
            <motion.span
              key={project.id}
              className="project-folder-icon-slot"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.2, ease: 'easeOut' }}
            >
              <FolderGit2 className="h-3.5 w-3.5" />
            </motion.span>
          ))}
          {extraCount > 0 && (
            <span className="project-folder-extra-count">+{extraCount}</span>
          )}
        </span>
        <span className="project-folder-label">
          {t('{{count}} projets', { count: projects.length })}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            className="project-folder-popover"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="project-folder-popover-header">
              <span className="project-folder-popover-title">
                {t('Projets groupes')}
              </span>
              <button
                type="button"
                className="project-folder-popover-close"
                onClick={() => setIsOpen(false)}
                aria-label={t('Fermer')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="project-folder-popover-list">
              {projects.map((project, i) => (
                <motion.button
                  key={project.id}
                  type="button"
                  className="project-folder-popover-item"
                  onClick={() => {
                    void handleProjectClick(project.id)
                  }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.03,
                    duration: 0.18,
                    ease: 'easeOut',
                  }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FolderGit2 className="h-4 w-4 shrink-0" />
                  <span className="project-folder-popover-name truncate">
                    {project.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}, (prevProps, nextProps) => {
  if (prevProps.projects.length !== nextProps.projects.length) return false
  for (let i = 0; i < prevProps.projects.length; i++) {
    if (prevProps.projects[i].id !== nextProps.projects[i].id) return false
    if (prevProps.projects[i].name !== nextProps.projects[i].name) return false
  }
  return true
})
