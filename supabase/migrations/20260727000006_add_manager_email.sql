-- ---------------------------------------------------------------------------
-- 20260727000006_add_manager_email.sql
-- Adds an email column to managers table as requested in Sprint 4 Phase 1.
-- ---------------------------------------------------------------------------

ALTER TABLE managers 
  ADD COLUMN email text;

-- In a real production system where managers already exist, we'd need to populate
-- emails before making it NOT NULL. Since this is a new table/dev environment,
-- we'll just set it to NOT NULL directly or handle it gracefully.
-- Assuming no existing records or dev data can be truncated/updated if needed.

-- Make it not null and unique.
ALTER TABLE managers 
  ALTER COLUMN email SET NOT NULL,
  ADD CONSTRAINT uq_managers_email UNIQUE (email);
