-- supabase/migrations/20260727000005_init_storage.sql
-- Aura OS — Migration 5: Storage
--
-- Creates the 'artifacts' private storage bucket.
-- DATABASE.md §7 Storage.
--
-- Run order: 5 (independent, but run after tables for clarity)

-- ---------------------------------------------------------------------------
-- Create artifacts bucket (private)
-- Only the authenticated Owner may read or write.
-- Files are stored at path {owner_id}/{mission_id}/{filename}.
-- DATABASE.md §7
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artifacts',
  'artifacts',
  false,  -- private bucket
  52428800,  -- 50 MB max per file
  null        -- all mime types allowed; restrict at service layer if needed
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage RLS: artifacts bucket
-- Only the authenticated Owner may upload to or download from this bucket.
-- Files live at {owner_id}/{mission_id}/{filename}.
-- ---------------------------------------------------------------------------

-- SELECT: Owner can read their own files (path starts with their auth.uid())
create policy "storage artifacts: owner can read own files"
  on storage.objects for select
  using (
    bucket_id = 'artifacts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- INSERT: Owner can upload their own files
create policy "storage artifacts: owner can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'artifacts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: Owner can update their own files (e.g. replace)
create policy "storage artifacts: owner can update own files"
  on storage.objects for update
  using (
    bucket_id = 'artifacts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: Owner can delete their own files
create policy "storage artifacts: owner can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'artifacts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
