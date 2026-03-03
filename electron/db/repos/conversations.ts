import type Database from 'better-sqlite3'

export type DbConversation = {
  id: string
  project_id: string
  title: string
  status: 'active' | 'done' | 'archived'
  is_relevant: number
  created_at: string
  updated_at: string
  last_message_at: string
}

export function listConversations(db: Database.Database): DbConversation[] {
  return db
    .prepare('SELECT * FROM conversations WHERE status != ? ORDER BY updated_at DESC')
    .all('archived') as DbConversation[]
}

export function insertConversation(
  db: Database.Database,
  params: { id: string; projectId: string; title: string; isRelevant?: boolean },
) {
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO conversations(id, project_id, title, status, is_relevant, created_at, updated_at, last_message_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(params.id, params.projectId, params.title, 'active', params.isRelevant === false ? 0 : 1, now, now, now)
}

export function findConversationById(db: Database.Database, id: string): DbConversation | undefined {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as DbConversation | undefined
}
