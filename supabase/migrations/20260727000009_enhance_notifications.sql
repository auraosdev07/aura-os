-- supabase/migrations/20260727000009_enhance_notifications.sql

-- 1. Create Enums
CREATE TYPE notification_type AS ENUM (
    'SYSTEM',
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR',
    'AI',
    'AUTOMATION'
);

CREATE TYPE notification_actor AS ENUM (
    'SYSTEM',
    'OWNER',
    'MANAGER',
    'EMPLOYEE',
    'AI'
);

CREATE TYPE notification_entity_type AS ENUM (
    'MISSION',
    'MANAGER',
    'EMPLOYEE',
    'KNOWLEDGE',
    'ARTIFACT'
);

-- 2. Add columns to notifications table
ALTER TABLE notifications ADD COLUMN type notification_type NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE notifications ADD COLUMN actor notification_actor NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE notifications ADD COLUMN entity_type notification_entity_type;
ALTER TABLE notifications ADD COLUMN entity_id UUID;
ALTER TABLE notifications ADD COLUMN deleted_at TIMESTAMPTZ;

-- 3. Create requested indexes
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_owner_created ON notifications(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_owner_unread ON notifications(owner_id, is_read);
