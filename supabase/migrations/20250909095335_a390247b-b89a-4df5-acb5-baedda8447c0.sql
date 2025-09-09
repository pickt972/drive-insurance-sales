-- Create API schema and expose views for PostgREST
create schema if not exists api;

-- Expose public tables via updatable views in schema api
create or replace view api.insurance_types as
  select id, name, commission, is_active, created_at, updated_at
  from public.insurance_types;

create or replace view api.profiles as
  select id, user_id, username, role, is_active, created_at, updated_at
  from public.profiles;

create or replace view api.sales as
  select id, employee_id, client_name, client_email, client_phone,
         reservation_number, insurance_type_id, commission_amount,
         notes, status, created_at, updated_at
  from public.sales;

create or replace view api.sale_insurances as
  select id, sale_id, insurance_type_id, commission_amount, created_at
  from public.sale_insurances;

create or replace view api.auto_exports as
  select id, type, file_name, file_path, export_date, status, error_message
  from public.auto_exports;

-- Grant schema usage and CRUD on views to API roles
grant usage on schema api to anon, authenticated;
grant select, insert, update, delete on all tables in schema api to anon, authenticated;

-- Ensure future views get the same grants
alter default privileges in schema api grant select, insert, update, delete on tables to anon, authenticated;