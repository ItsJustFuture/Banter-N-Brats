-- DnD character metadata fields
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS race TEXT;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE dnd_characters ADD COLUMN IF NOT EXISTS background TEXT;
