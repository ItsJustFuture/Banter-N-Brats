-- Profile banner customization
ALTER TABLE users ADD COLUMN banner_url TEXT;
ALTER TABLE users ADD COLUMN banner_gradient TEXT;
ALTER TABLE users ADD COLUMN banner_style TEXT DEFAULT 'cover';

-- Custom status
ALTER TABLE users ADD COLUMN custom_status TEXT;
ALTER TABLE users ADD COLUMN status_emoji TEXT;
ALTER TABLE users ADD COLUMN status_color TEXT;
ALTER TABLE users ADD COLUMN status_expires_at INTEGER;
