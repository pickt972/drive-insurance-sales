-- Ensure API schema exposes public tables via updatable views
CREATE SCHEMA IF NOT EXISTS api;
GRANT USAGE ON SCHEMA api TO anon, authenticated;

-- Recreate api.profiles view mapping to public.profiles
DROP VIEW IF EXISTS api.profiles CASCADE;
CREATE VIEW api.profiles AS
  SELECT id, user_id, username, role, is_active, created_at, updated_at
  FROM public.profiles;

-- Allow REST roles to use the view (RLS still enforced on base table)
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO anon, authenticated;