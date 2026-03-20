import type Database from 'better-sqlite3'

export type DbCloudInstance = {
  id: string
  name: string
  base_url: string
  auth_mode: 'oauth'
  connection_status: 'connected' | 'connecting' | 'disconnected' | 'error'
  last_error: string | null
  created_at: string
  updated_at: string
}

export function listCloudInstances(db: Database.Database): DbCloudInstance[] {
  return db.prepare('SELECT * FROM cloud_instances ORDER BY updated_at DESC').all() as DbCloudInstance[]
}

export function findCloudInstanceById(db: Database.Database, id: string): DbCloudInstance | undefined {
  return db.prepare('SELECT * FROM cloud_instances WHERE id = ?').get(id) as DbCloudInstance | undefined
}

export function findCloudInstanceByBaseUrl(db: Database.Database, baseUrl: string): DbCloudInstance | undefined {
  return db.prepare('SELECT * FROM cloud_instances WHERE base_url = ?').get(baseUrl) as DbCloudInstance | undefined
}

export function insertCloudInstance(
  db: Database.Database,
  params: {
    id: string
    name: string
    baseUrl: string
    authMode?: 'oauth'
    connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error'
    lastError?: string | null
  },
): void {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO cloud_instances(
      id, name, base_url, auth_mode, connection_status, last_error, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    params.id,
    params.name,
    params.baseUrl,
    params.authMode ?? 'oauth',
    params.connectionStatus ?? 'connected',
    params.lastError ?? null,
    now,
    now,
  )
}

export function updateCloudInstanceStatus(
  db: Database.Database,
  id: string,
  status: 'connected' | 'connecting' | 'disconnected' | 'error',
  lastError?: string | null,
): boolean {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `UPDATE cloud_instances
       SET connection_status = ?, last_error = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(status, lastError ?? null, now, id)
  return result.changes > 0
}
