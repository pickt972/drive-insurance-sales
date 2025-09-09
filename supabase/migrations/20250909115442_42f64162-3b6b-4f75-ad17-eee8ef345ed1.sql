-- Créer une fonction RPC pour créer les tokens de réinitialisation
CREATE OR REPLACE FUNCTION public.create_password_reset_token(
  p_username text,
  p_user_id uuid,
  p_token text,
  p_expires_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- D'abord, nettoyer les anciens tokens pour cet utilisateur
  DELETE FROM public.password_reset_tokens 
  WHERE username = p_username OR user_id = p_user_id;
  
  -- Insérer le nouveau token
  INSERT INTO public.password_reset_tokens (username, user_id, token, expires_at)
  VALUES (p_username, p_user_id, p_token, p_expires_at);
END;
$$;

-- Créer une fonction RPC pour récupérer un token valide
CREATE OR REPLACE FUNCTION public.get_valid_reset_token(
  p_token text,
  p_username text
)
RETURNS TABLE(user_id uuid, username text, token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT prt.user_id, prt.username, prt.token
  FROM public.password_reset_tokens prt
  WHERE prt.token = p_token 
    AND prt.username = p_username
    AND prt.expires_at > now()
    AND prt.used = false;
END;
$$;

-- Créer une fonction RPC pour marquer un token comme utilisé
CREATE OR REPLACE FUNCTION public.mark_reset_token_used(
  p_token text
)
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