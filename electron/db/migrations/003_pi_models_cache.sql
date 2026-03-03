CREATE TABLE IF NOT EXISTS pi_models_cache (
  key TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pi_models_cache_provider_id
  ON pi_models_cache(provider, id);
