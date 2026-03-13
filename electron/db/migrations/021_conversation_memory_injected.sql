-- Add memory_injected column to conversations table

ALTER TABLE conversations ADD COLUMN memory_injected INTEGER DEFAULT 0;