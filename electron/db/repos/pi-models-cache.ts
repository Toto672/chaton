import type Database from 'better-sqlite3'

export type DbPiModelCache = {
  key: string
  provider: string
  id: string
  updated_at: string
}

export function listPiModelsCache(db: Database.Database): DbPiModelCache[] {
  return db
    .prepare('SELECT key, provider, id, updated_at FROM pi_models_cache ORDER BY provider ASC, id ASC')
    .all() as DbPiModelCache[]
}

export function replacePiModelsCache(
  db: Database.Database,
  models: Array<{ key: string; provider: string; id: string }>,
) {
  const now = new Date().toISOString()
  const clearStmt = db.prepare('DELETE FROM pi_models_cache')
  const insertStmt = db.prepare(
    'INSERT INTO pi_models_cache(key, provider, id, updated_at) VALUES (?, ?, ?, ?)',
  )

  const tx = db.transaction(() => {
    clearStmt.run()
    for (const model of models) {
      insertStmt.run(model.key, model.provider, model.id, now)
    }
  })

  tx()
}
