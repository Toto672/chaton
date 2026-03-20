PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cloud_instances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL UNIQUE,
  auth_mode TEXT NOT NULL DEFAULT 'oauth',
  connection_status TEXT NOT NULL DEFAULT 'disconnected',
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE projects ADD COLUMN location TEXT NOT NULL DEFAULT 'local';
ALTER TABLE projects ADD COLUMN cloud_instance_id TEXT;
ALTER TABLE projects ADD COLUMN organization_id TEXT;
ALTER TABLE projects ADD COLUMN organization_name TEXT;
ALTER TABLE projects ADD COLUMN cloud_status TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location);
CREATE INDEX IF NOT EXISTS idx_projects_cloud_instance_id ON projects(cloud_instance_id);
CREATE INDEX IF NOT EXISTS idx_cloud_instances_updated_at ON cloud_instances(updated_at);
