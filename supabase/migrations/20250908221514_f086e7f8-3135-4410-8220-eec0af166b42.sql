-- Ensure API schema exists and expose public tables via views for REST access
create schema if not exists api;

-- Expose insurance types
create or replace view api.insurance_types as
  select id, name, commission, is_active, created_at, updated_at
  from public.insurance_types;

-- Expose sales
create or replace view api.sales as
  select id, employee_id, client_name, client_email, client_phone,
         reservation_number, insurance_type_id, commission_amount,
         notes, status, created_at, updated_at
  from public.sales;

-- (Optional) Expose profiles to keep consistency (already likely exists)
create or replace view api.profiles as
  select id, user_id, username, role, is_active, created_at, updated_at
  from public.profiles;

-- Grant usage on api schema
grant usage on schema api to anon, authenticated;

-- Grant privileges on views (RLS on base tables still applies)
grant select on api.insurance_types to authenticated;
grant select on api.profiles to anon, authenticated;
grant select, insert, update, delete on api.sales to authenticated;