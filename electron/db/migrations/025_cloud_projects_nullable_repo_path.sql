PRAGMA foreign_keys = OFF;

CREATE TABLE projects_next (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  repo_path TEXT UNIQUE,
  repo_name TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  location TEXT NOT NULL DEFAULT 'local',
  cloud_instance_id TEXT,
  organization_id TEXT,
  organization_name TEXT,
  cloud_status TEXT
);

INSERT INTO projects_next (
  id,
  name,
  repo_path,
  repo_name,
  is_archived,
  created_at,
  updated_at,
  is_hidden,
  icon,
  location,
  cloud_instance_id,
  organization_id,
  organization_name,
  cloud_status
)
SELECT
  id,
  name,
  repo_path,
  repo_name,
  is_archived,
  created_at,
  updated_at,
  COALESCE(is_hidden, 0),
  icon,
  COALESCE(location, 'local'),
  cloud_instance_id,
  organization_id,
  organization_name,
  cloud_status
FROM projects;

DROP TABLE projects;
ALTER TABLE projects_next RENAME TO projects;

CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location);
CREATE INDEX IF NOT EXISTS idx_projects_cloud_instance_id ON projects(cloud_instance_id);

PRAGMA foreign_keys = ON;
