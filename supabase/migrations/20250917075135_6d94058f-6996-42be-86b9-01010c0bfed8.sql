-- CORRECTION: Résoudre les problèmes de sécurité corrigeables

-- 1. Corriger les vues API pour éviter les erreurs Security Definer
DROP VIEW IF EXISTS api.profiles CASCADE;
DROP VIEW IF EXISTS api.insurance_types CASCADE;

-- Recréer les vues en tant que vues simples (sans règles complexes)
CREATE VIEW api.profiles AS
SELECT 
  id, 
  user_id, 
  username, 
  role, 
  is_active, 
  created_at, 
  updated_at
FROM public.profiles;

CREATE VIEW api.insurance_types AS
SELECT 
  id, 
  name, 
  commission, 
  is_active, 
  created_at, 
  updated_at
FROM public.insurance_types
WHERE is_active = true;

-- Accorder les permissions nécessaires
GRANT SELECT ON api.profiles TO postgres, anon, authenticated, service_role;
GRANT SELECT ON api.insurance_types TO postgres, anon, authenticated, service_role;

-- 2. Créer une fonction sécurisée pour les opérations sur profiles
CREATE OR REPLACE FUNCTION api.upsert_profile(
  p_user_id uuid,
  p_username text,
  p_role text DEFAULT 'employee'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_profile json;
BEGIN
  -- Insérer ou mettre à jour le profil
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (p_user_id, p_username, p_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    updated_at = now()
  RETURNING to_json(profiles.*) INTO result_profile;
  
  RETURN result_profile;
END;
$$;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION api.upsert_profile TO postgres, anon, authenticated, service_role;