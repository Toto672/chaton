import type Database from 'better-sqlite3'

export type DbPiModelCache = {
  key: string
  provider: string
  id: string
  supports_thinking: number
  thinking_levels_json: string | null
  updated_at: string
}

export function listPiModelsCache(db: Database.Database): DbPiModelCache[] {
  return db
    .prepare(
      'SELECT key, provider, id, supports_thinking, thinking_levels_json, updated_at FROM pi_models_cache ORDER BY provider ASC, id ASC',
    )
    .all() as DbPiModelCache[]
}

export function replacePiModelsCache(
  db: Database.Database,
  models: Array<{
    key: string
    provider: string
    id: string
    supportsThinking: boolean
    thinkingLevels: string[]
  }>,
) {
  const now = new Date().toISOString()
  const clearStmt = db.prepare('DELETE FROM pi_models_cache')
  const insertStmt = db.prepare(
    'INSERT INTO pi_models_cache(key, provider, id, supports_thinking, thinking_levels_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )

  const tx = db.transaction(() => {
    clearStmt.run()
    for (const model of models) {
      insertStmt.run(
        model.key,
        model.provider,
        model.id,
        model.supportsThinking ? 1 : 0,
        model.thinkingLevels.length > 0 ? JSON.stringify(model.thinkingLevels) : null,
        now,
      )
    }
  })

  tx()
}
