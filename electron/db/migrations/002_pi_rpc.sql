ALTER TABLE conversations ADD COLUMN pi_session_file TEXT;
ALTER TABLE conversations ADD COLUMN model_provider TEXT;
ALTER TABLE conversations ADD COLUMN model_id TEXT;
ALTER TABLE conversations ADD COLUMN thinking_level TEXT;
ALTER TABLE conversations ADD COLUMN last_runtime_error TEXT;

CREATE TABLE IF NOT EXISTS conversation_messages_cache (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_cache_conversation_created
  ON conversation_messages_cache(conversation_id, created_at);
