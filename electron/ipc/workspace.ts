import { dialog, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

import { getDb } from '../db/index.js'
import { findConversationById, insertConversation, listConversations } from '../db/repos/conversations.js'
import { findProjectByRepoPath, insertProject, listProjects } from '../db/repos/projects.js'
import { getSidebarSettings, saveSidebarSettings, type DbSidebarSettings } from '../db/repos/settings.js'

type WorkspacePayload = {
  projects: Array<{
    id: string
    name: string
    repoPath: string
    repoName: string
    isArchived: boolean
    createdAt: string
    updatedAt: string
  }>
  conversations: Array<{
    id: string
    projectId: string
    title: string
    status: 'active' | 'done' | 'archived'
    isRelevant: boolean
    createdAt: string
    updatedAt: string
    lastMessageAt: string
  }>
  settings: DbSidebarSettings
}

function toWorkspacePayload(): WorkspacePayload {
  const db = getDb()
  const projects = listProjects(db).map((p) => ({
    id: p.id,
    name: p.name,
    repoPath: p.repo_path,
    repoName: p.repo_name,
    isArchived: Boolean(p.is_archived),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))

  const conversations = listConversations(db).map((c) => ({
    id: c.id,
    projectId: c.project_id,
    title: c.title,
    status: c.status,
    isRelevant: Boolean(c.is_relevant),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    lastMessageAt: c.last_message_at,
  }))

  return {
    projects,
    conversations,
    settings: getSidebarSettings(db),
  }
}

function isGitRepo(folderPath: string) {
  return fs.existsSync(path.join(folderPath, '.git'))
}

export function registerWorkspaceIpc() {
  ipcMain.handle('dialog:pickProjectFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Ajouter un nouveau projet',
      buttonLabel: 'Importer',
      properties: ['openDirectory', 'createDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('workspace:getInitialState', () => toWorkspacePayload())

  ipcMain.handle('workspace:updateSettings', (_event, settings: DbSidebarSettings) => {
    const db = getDb()
    saveSidebarSettings(db, settings)
    return settings
  })

  ipcMain.handle('conversations:createForProject', (_event, projectId: string) => {
    const db = getDb()
    const project = listProjects(db).find((item) => item.id === projectId)
    if (!project) {
      return { ok: false as const, reason: 'project_not_found' as const }
    }

    const conversationId = crypto.randomUUID()
    insertConversation(db, {
      id: conversationId,
      projectId,
      title: `Nouveau fil - ${project.name}`,
    })

    const conversation = findConversationById(db, conversationId)
    if (!conversation) {
      return { ok: false as const, reason: 'unknown' as const }
    }

    return {
      ok: true as const,
      conversation: {
        id: conversation.id,
        projectId: conversation.project_id,
        title: conversation.title,
        status: conversation.status,
        isRelevant: Boolean(conversation.is_relevant),
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        lastMessageAt: conversation.last_message_at,
      },
    }
  })

  ipcMain.handle('projects:importFromFolder', (_event, folderPath: string) => {
    const db = getDb()

    if (!folderPath || !isGitRepo(folderPath)) {
      return { ok: false, reason: 'not_git_repo' as const }
    }

    const existing = findProjectByRepoPath(db, folderPath)
    if (existing) {
      return {
        ok: true,
        duplicate: true,
        project: {
          id: existing.id,
          name: existing.name,
          repoPath: existing.repo_path,
          repoName: existing.repo_name,
          isArchived: Boolean(existing.is_archived),
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
        },
      }
    }

    const repoName = path.basename(folderPath)
    const id = crypto.randomUUID()
    insertProject(db, {
      id,
      name: repoName,
      repoName,
      repoPath: folderPath,
    })

    const project = listProjects(db).find((p) => p.id === id)
    if (!project) {
      return { ok: false, reason: 'unknown' as const }
    }

    return {
      ok: true,
      duplicate: false,
      project: {
        id: project.id,
        name: project.name,
        repoPath: project.repo_path,
        repoName: project.repo_name,
        isArchived: Boolean(project.is_archived),
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    }
  })
}
