-- Create API helper function to insert reset tokens into public table
CREATE SCHEMA IF NOT EXISTS api;
CREATE OR REPLACE FUNCTION api.create_password_reset_token(
  p_user_id uuid,
  p_username text,
  p_token text,
  p_expires_at timestamptz
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.password_reset_tokens (user_id, username, token, expires_at, used)
  VALUES (p_user_id, p_username, p_token, p_expires_at, false);
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION api.create_password_reset_token(uuid, text, text, timestamptz) TO service_role;