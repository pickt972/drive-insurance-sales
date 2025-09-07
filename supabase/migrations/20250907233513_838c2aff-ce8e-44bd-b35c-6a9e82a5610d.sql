-- Grant service role access to API schema and profiles view
GRANT USAGE ON SCHEMA api TO service_role;
GRANT SELECT ON api.profiles TO service_role;

-- Additionally ensure access on public schema (for safety if used elsewhere)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.profiles TO service_role;