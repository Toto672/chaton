-- Persist queued outgoing composer messages so they survive app crashes.
CREATE TABLE IF NOT EXISTS composer_queued_messages (
  key TEXT PRIMARY KEY,
  messages_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_composer_queued_messages_updated_at
  ON composer_queued_messages(updated_at);
