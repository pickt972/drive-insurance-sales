/*
# Fix API Schema Consistency Issues

This migration resolves PostgREST schema cache errors by:

1. **Schema Cleanup**
   - Drop inconsistent views and tables in api schema
   - Recreate views that properly map to public schema tables

2. **View Corrections**
   - Fix api.sales view to match public.sales table structure
   - Convert api.employee_objectives from table to view
   - Ensure all views have consistent column mappings

3. **Security & Permissions**
   - Maintain RLS policies on public tables
   - Grant appropriate permissions on api schema views
   - Ensure PostgREST can properly introspect the schema

4. **Important Notes**
   - This fixes PGRST002 "Could not query the database for the schema cache" errors
   - All data remains in public schema tables
   - API schema only contains views for PostgREST exposure
*/

-- Ensure api schema exists
CREATE SCHEMA IF NOT EXISTS api;

-- Drop existing problematic views and tables in api schema
DROP VIEW IF EXISTS api.sales CASCADE;
DROP TABLE IF EXISTS api.employee_objectives CASCADE;
DROP VIEW IF EXISTS api.employee_objectives CASCADE;
DROP VIEW IF EXISTS api.profiles CASCADE;
DROP VIEW IF EXISTS api.insurance_types CASCADE;
DROP VIEW IF EXISTS api.sale_insurances CASCADE;
DROP VIEW IF EXISTS api.auto_exports CASCADE;

-- Recreate api.profiles view
CREATE OR REPLACE VIEW api.profiles AS
SELECT 
  id, 
  user_id, 
  username, 
  role, 
  is_active, 
  created_at, 
  updated_at
FROM public.profiles;

-- Recreate api.insurance_types view
CREATE OR REPLACE VIEW api.insurance_types AS
SELECT 
  id, 
  name, 
  commission, 
  is_active, 
  created_at, 
  updated_at
FROM public.insurance_types;

-- Recreate api.sales view with correct column mapping
CREATE OR REPLACE VIEW api.sales AS
SELECT 
  id,
  employee_name,
  client_name,
  client_email,
  client_phone,
  reservation_number,
  insurance_type_id,
  commission_amount,
  notes,
  status,
  created_at,
  updated_at
FROM public.sales;

-- Create api.employee_objectives as a view (not table)
CREATE OR REPLACE VIEW api.employee_objectives AS
SELECT 
  id,
  employee_name,
  objective_type,
  target_amount,
  target_sales_count,
  period_start,
  period_end,
  description,
  is_active,
  created_at,
  updated_at
FROM public.employee_objectives;

-- Recreate other views if they exist in public schema
DO $$
BEGIN
  -- Check if sale_insurances table exists and create view
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sale_insurances') THEN
    EXECUTE 'CREATE OR REPLACE VIEW api.sale_insurances AS
    SELECT 
      id, 
      sale_id, 
      insurance_type_id, 
      commission_amount, 
      created_at
    FROM public.sale_insurances';
  END IF;

  -- Check if auto_exports table exists and create view
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auto_exports') THEN
    EXECUTE 'CREATE OR REPLACE VIEW api.auto_exports AS
    SELECT 
      id, 
      type, 
      file_name, 
      file_path, 
      export_date, 
      status, 
      error_message
    FROM public.auto_exports';
  END IF;
END $$;

-- Grant schema usage to required roles
GRANT USAGE ON SCHEMA api TO postgres, anon, authenticated, service_role;

-- Grant permissions on all views in api schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO postgres, anon, authenticated, service_role;

-- Ensure future tables/views get the same permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO postgres, anon, authenticated, service_role;

-- Create rules for updatable views to redirect DML operations to public schema

-- Rules for api.profiles
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
  RETURNING *;

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
  RETURNING *;

CREATE OR REPLACE RULE profiles_delete AS
ON DELETE TO api.profiles
DO INSTEAD
  DELETE FROM public.profiles
  WHERE id = OLD.id
  RETURNING *;

-- Rules for api.sales
CREATE OR REPLACE RULE sales_insert AS
ON INSERT TO api.sales
DO INSTEAD
  INSERT INTO public.sales (id, employee_name, client_name, client_email, client_phone, reservation_number, insurance_type_id, commission_amount, notes, status, created_at, updated_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.employee_name,
    NEW.client_name,
    NEW.client_email,
    NEW.client_phone,
    NEW.reservation_number,
    NEW.insurance_type_id,
    NEW.commission_amount,
    NEW.notes,
    COALESCE(NEW.status, 'pending'),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING *;

CREATE OR REPLACE RULE sales_update AS
ON UPDATE TO api.sales
DO INSTEAD
  UPDATE public.sales
  SET
    employee_name = NEW.employee_name,
    client_name = NEW.client_name,
    client_email = NEW.client_email,
    client_phone = NEW.client_phone,
    reservation_number = NEW.reservation_number,
    insurance_type_id = NEW.insurance_type_id,
    commission_amount = NEW.commission_amount,
    notes = NEW.notes,
    status = NEW.status,
    updated_at = now()
  WHERE id = OLD.id
  RETURNING *;

CREATE OR REPLACE RULE sales_delete AS
ON DELETE TO api.sales
DO INSTEAD
  DELETE FROM public.sales
  WHERE id = OLD.id
  RETURNING *;

-- Rules for api.employee_objectives
CREATE OR REPLACE RULE employee_objectives_insert AS
ON INSERT TO api.employee_objectives
DO INSTEAD
  INSERT INTO public.employee_objectives (id, employee_name, objective_type, target_amount, target_sales_count, period_start, period_end, description, is_active, created_at, updated_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.employee_name,
    COALESCE(NEW.objective_type, 'monthly'),
    COALESCE(NEW.target_amount, 0),
    COALESCE(NEW.target_sales_count, 0),
    NEW.period_start,
    NEW.period_end,
    NEW.description,
    COALESCE(NEW.is_active, true),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING *;

CREATE OR REPLACE RULE employee_objectives_update AS
ON UPDATE TO api.employee_objectives
DO INSTEAD
  UPDATE public.employee_objectives
  SET
    employee_name = NEW.employee_name,
    objective_type = NEW.objective_type,
    target_amount = NEW.target_amount,
    target_sales_count = NEW.target_sales_count,
    period_start = NEW.period_start,
    period_end = NEW.period_end,
    description = NEW.description,
    is_active = NEW.is_active,
    updated_at = now()
  WHERE id = OLD.id
  RETURNING *;

CREATE OR REPLACE RULE employee_objectives_delete AS
ON DELETE TO api.employee_objectives
DO INSTEAD
  DELETE FROM public.employee_objectives
  WHERE id = OLD.id
  RETURNING *;