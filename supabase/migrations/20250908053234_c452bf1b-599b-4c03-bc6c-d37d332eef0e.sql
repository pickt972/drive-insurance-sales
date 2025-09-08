-- Ensure RPCs live in the exposed 'api' schema
DROP FUNCTION IF EXISTS public.get_valid_reset_token(text, text);
DROP FUNCTION IF EXISTS public.mark_reset_token_used(text);

CREATE OR REPLACE FUNCTION api.get_valid_reset_token(p_token text, p_username text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  token text,
  expires_at timestamptz,
  used boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, username, token, expires_at, used, created_at
  FROM public.password_reset_tokens
  WHERE token = p_token
    AND username ILIKE p_username
    AND used = false
    AND expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION api.mark_reset_token_used(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.password_reset_tokens
  SET used = true
  WHERE token = p_token;
END;
$$;