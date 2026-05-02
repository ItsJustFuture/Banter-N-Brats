-- Add age, traits, and abilities fields to DnD characters
ALTER TABLE dnd_characters ADD COLUMN age INTEGER;
ALTER TABLE dnd_characters ADD COLUMN traits TEXT;
ALTER TABLE dnd_characters ADD COLUMN abilities TEXT;
