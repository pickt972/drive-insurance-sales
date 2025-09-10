-- Ensure api schema exists
create schema if not exists api;

-- Recreate or create the updatable view for sales in the api schema
create or replace view api.sales as
select 
  id,
  employee_name,
  client_name,
  reservation_number,
  insurance_type_id,
  commission_amount,
  notes,
  status,
  created_at,
  updated_at,
  client_email,
  client_phone
from public.sales;