-- Message read receipts for persistent tracking
-- Replaces in-memory read receipt tracking

-- Main message read receipts (room messages)
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  room_name TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  read_at INTEGER NOT NULL,
  UNIQUE(message_id, user_id)
);

-- DM thread read tracking (enhanced from in-memory)
CREATE TABLE IF NOT EXISTS dm_read_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  last_read_message_id INTEGER,
  last_read_at INTEGER NOT NULL,
  UNIQUE(thread_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_room ON message_read_receipts(room_name);
CREATE INDEX IF NOT EXISTS idx_dm_read_thread ON dm_read_tracking(thread_id);
CREATE INDEX IF NOT EXISTS idx_dm_read_user ON dm_read_tracking(user_id);

-- Message delivery status (for tracking if message was delivered to client)
CREATE TABLE IF NOT EXISTS message_delivery_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  room_name TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  delivered_at INTEGER NOT NULL,
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_receipts_message ON message_delivery_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_user ON message_delivery_receipts(user_id);
