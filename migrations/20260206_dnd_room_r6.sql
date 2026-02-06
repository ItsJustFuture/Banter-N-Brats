-- Canonical DnD room entry (R6)

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_id TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT;

DELETE FROM rooms
 WHERE replace(replace(replace(lower(name), ' ', ''), '-', ''), '_', '') IN ('dndstoryroom', 'dndstory');

INSERT INTO rooms (name, created_by, created_at, room_id, description, is_system, room_sort_order)
VALUES ('dnd', NULL, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT, 'R6', 'DnD room', 1, 5)
ON CONFLICT (name) DO UPDATE
SET room_id = COALESCE(rooms.room_id, EXCLUDED.room_id),
    description = COALESCE(rooms.description, EXCLUDED.description),
    is_system = 1,
    archived = 0;
