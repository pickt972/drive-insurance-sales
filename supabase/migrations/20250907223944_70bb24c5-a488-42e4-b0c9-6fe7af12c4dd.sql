-- Fix security issues
-- Update the function to have secure search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;