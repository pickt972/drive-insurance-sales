-- Enable required extensions if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule monthly report on the 1st of every month at 07:00 UTC
select
  cron.schedule(
    'monthly-sales-report-pdf',
    '0 7 1 * *',
    $$
    select
      net.http_post(
        url := 'https://jwvkvyhwhpbyruattzbx.supabase.co/functions/v1/monthly-sales-report',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dmt2eWh3aHBieXJ1YXR0emJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTg1MDIsImV4cCI6MjA3Mjc3NDUwMn0.zmkDfwu1JalKorw5sl3VBaj28C6qaifrRPU-aGT6Et8"}'::jsonb,
        body := '{"trigger":"cron"}'::jsonb
      );
    $$
  );