-- Ensure api schema and views for PostgREST configuration that exposes only 'api'
CREATE SCHEMA IF NOT EXISTS api;

-- Grant usage to required roles
GRANT USAGE ON SCHEMA api TO postgres, anon, authenticated, service_role;

-- Create updatable view for profiles mapped to public.profiles
CREATE OR REPLACE VIEW api.profiles AS
SELECT id, user_id, username, role, is_active, created_at, updated_at
FROM public.profiles;

-- Permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO postgres, anon, authenticated, service_role;

-- Rules to redirect DML on view to base table
CREATE OR REPLACE RULE profiles_insert AS
ON INSERT TO api.profiles
DO INSTEAD
  INSERT INTO public.profiles (id, user_id, username, role, is_active, created_at, updated_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.username,
    NEW.role,
    COALESCE(NEW.is_active, true),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING public.profiles.*;

CREATE OR REPLACE RULE profiles_update AS
ON UPDATE TO api.profiles
DO INSTEAD
  UPDATE public.profiles
  SET
    user_id = NEW.user_id,
    username = NEW.username,
    role = NEW.role,
    is_active = NEW.is_active,
    updated_at = now()
  WHERE id = OLD.id
  RETURNING public.profiles.*;

CREATE OR REPLACE RULE profiles_delete AS
ON DELETE TO api.profiles
DO INSTEAD
  DELETE FROM public.profiles
  WHERE id = OLD.id
  RETURNING public.profiles.*;

-- Read-only view for insurance_types
CREATE OR REPLACE VIEW api.insurance_types AS
SELECT id, name, commission, is_active, created_at, updated_at
FROM public.insurance_types;

GRANT SELECT ON api.insurance_types TO postgres, anon, authenticated, service_role;
