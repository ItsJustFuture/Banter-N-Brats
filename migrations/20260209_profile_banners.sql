-- Profile banner customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_gradient TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_style TEXT DEFAULT 'cover';

-- Custom status
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_emoji TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_color TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_expires_at INTEGER;
