ALTER TABLE pi_models_cache ADD COLUMN supports_thinking INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pi_models_cache ADD COLUMN thinking_levels_json TEXT;
