import { useMemo } from 'react'

import type { Project, Conversation } from '@/features/workspace/types'
import type { PiStoreState } from '@/features/workspace/store/pi-store'
import { usePiStore } from '@/features/workspace/store/pi-store'

/**
 * Scoring criteria to decide which projects get folded:
 * - Projects with no recent conversation activity score higher (more foldable)
 * - Projects with many conversations relative to total score higher
 * - Projects with running conversations or unread completions are NEVER folded
 * - The currently selected project is NEVER folded
 *
 * Returns { visible, folded } split of projects.
 */

// Projects with a conversation newer than this are considered "recent"
const RECENT_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

// Minimum total projects before we start folding any
const MIN_PROJECTS_TO_FOLD = 5

// How many projects to always keep visible (at minimum)
const MIN_VISIBLE = 3

function hasActiveConversation(
  projectId: string,
  conversations: Conversation[],
  piState: PiStoreState,
): boolean {
  return conversations.some((c) => {
    if (c.projectId !== projectId) return false
    const runtime = piState.piByConversation[c.id]
    if (!runtime) return false
    return (
      runtime.status === 'streaming' ||
      runtime.status === 'starting' ||
      !!runtime.pendingUserMessage
    )
  })
}

function hasUnreadCompletion(
  projectId: string,
  conversations: Conversation[],
  piState: PiStoreState,
): boolean {
  return conversations.some((c) => {
    if (c.projectId !== projectId) return false
    return !!piState.completedActionByConversation[c.id]
  })
}

function getLatestConversationTimestamp(projectId: string, conversations: Conversation[]): number {
  let latest = 0
  for (const c of conversations) {
    if (c.projectId !== projectId) continue
    const ts = new Date(c.lastMessageAt || c.updatedAt).getTime()
    if (ts > latest) latest = ts
  }
  return latest
}

function getConversationCount(projectId: string, conversations: Conversation[]): number {
  return conversations.filter((c) => c.projectId === projectId).length
}

type FoldScore = {
  project: Project
  score: number
  pinned: boolean // never fold
}

export function useProjectFolder(
  projects: Project[],
  conversations: Conversation[],
  selectedProjectId: string | null,
): { visible: Project[]; folded: Project[] } {
  const piState = usePiStore((s) => s)

  return useMemo(() => {
    // Don't fold if there aren't enough projects
    if (projects.length <= MIN_PROJECTS_TO_FOLD) {
      return { visible: projects, folded: [] }
    }

    const now = Date.now()

    const scored: FoldScore[] = projects.map((project) => {
      // Pinned projects are never folded
      const isSelected = project.id === selectedProjectId
      const isActive = hasActiveConversation(project.id, conversations, piState)
      const hasUnread = hasUnreadCompletion(project.id, conversations, piState)
      const pinned = isSelected || isActive || hasUnread

      if (pinned) {
        return { project, score: -Infinity, pinned: true }
      }

      let score = 0
      const latestTs = getLatestConversationTimestamp(project.id, conversations)
      const convCount = getConversationCount(project.id, conversations)

      // Recency: older projects score higher (more foldable)
      if (latestTs === 0) {
        // No conversations at all - very foldable
        score += 50
      } else {
        const ageMs = now - latestTs
        if (ageMs > RECENT_THRESHOLD_MS) {
          // Not recent: higher score = more foldable
          score += Math.min(40, 20 + (ageMs / (24 * 60 * 60 * 1000)))
        } else {
          // Recent activity: lower score
          score += Math.max(0, 5 - (convCount * 0.5))
        }
      }

      // Projects with no conversations are very foldable
      if (convCount === 0) {
        score += 20
      }

      return { project, score, pinned: false }
    })

    // Sort by score descending (highest score = most foldable)
    scored.sort((a, b) => b.score - a.score)

    // Determine how many to fold: fold roughly half of the excess
    // beyond MIN_VISIBLE, but at least keep MIN_VISIBLE visible
    const pinnedCount = scored.filter((s) => s.pinned).length
    const foldableItems = scored.filter((s) => !s.pinned)
    const desiredVisible = Math.max(MIN_VISIBLE, pinnedCount + Math.ceil(foldableItems.length * 0.4))
    const maxFolded = Math.max(0, projects.length - desiredVisible)

    const folded: Project[] = []
    const visible: Project[] = []

    // Take the top-scored (most foldable) non-pinned projects for folding
    let foldedCount = 0
    for (const item of scored) {
      if (item.pinned) {
        visible.push(item.project)
      } else if (foldedCount < maxFolded && item.score > 10) {
        // Only fold items with a meaningful score (avoids folding very active projects)
        folded.push(item.project)
        foldedCount++
      } else {
        visible.push(item.project)
      }
    }

    // Preserve original project order for visible items
    const visibleIds = new Set(visible.map((p) => p.id))
    const orderedVisible = projects.filter((p) => visibleIds.has(p.id))
    const orderedFolded = projects.filter((p) => !visibleIds.has(p.id))

    return { visible: orderedVisible, folded: orderedFolded }
  }, [projects, conversations, selectedProjectId, piState])
}
