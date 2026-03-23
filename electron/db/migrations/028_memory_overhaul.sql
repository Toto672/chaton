ALTER TABLE memory_entries ADD COLUMN topic_key TEXT NOT NULL DEFAULT '';
ALTER TABLE memory_entries ADD COLUMN confidence REAL NOT NULL DEFAULT 0.5;
ALTER TABLE memory_entries ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memory_entries ADD COLUMN reinforced_at TEXT;
ALTER TABLE memory_entries ADD COLUMN last_used_at TEXT;
ALTER TABLE memory_entries ADD COLUMN times_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memory_entries ADD COLUMN source_conversation_id TEXT;
ALTER TABLE memory_entries ADD COLUMN origin_type TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE memory_entries ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE memory_entries ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE memory_entries ADD COLUMN fingerprint TEXT NOT NULL DEFAULT '';
ALTER TABLE memory_entries ADD COLUMN last_seen_at TEXT;

CREATE INDEX IF NOT EXISTS idx_memory_entries_fingerprint
  ON memory_entries(fingerprint, status, archived);

CREATE INDEX IF NOT EXISTS idx_memory_entries_scope_status
  ON memory_entries(scope, project_id, status, archived, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_entries_source_conversation
  ON memory_entries(source_conversation_id);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_entries_fts USING fts5(
  memory_id UNINDEXED,
  title,
  content,
  tags,
  topic_key,
  tokenize = 'porter unicode61'
);

INSERT INTO memory_entries_fts(memory_id, title, content, tags, topic_key)
SELECT
  id,
  COALESCE(title, ''),
  COALESCE(content, ''),
  COALESCE(tags_json, ''),
  COALESCE(topic_key, '')
FROM memory_entries
WHERE id NOT IN (SELECT memory_id FROM memory_entries_fts);
