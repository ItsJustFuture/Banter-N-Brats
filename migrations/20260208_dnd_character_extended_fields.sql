-- Add age, traits, and abilities fields to DnD characters
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS traits TEXT;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS abilities TEXT;
