-- Add trigger_data column to store cron expressions or other trigger-specific data
ALTER TABLE automation_rules ADD COLUMN trigger_data TEXT;
