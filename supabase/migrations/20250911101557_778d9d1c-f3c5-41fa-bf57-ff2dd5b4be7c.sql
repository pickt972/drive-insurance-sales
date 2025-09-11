-- Corriger la structure pour permettre les profils temporaires sans user_id
-- Puis créer une fonction pour associer les profils lors de la première connexion

-- Modifier temporairement la contrainte user_id pour permettre NULL
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Insérer les profils des utilisateurs manquants avec user_id temporaire NULL
INSERT INTO profiles (username, role, is_active, user_id) 
VALUES 
  ('admin', 'admin', true, NULL),
  ('Julie', 'employee', true, NULL),
  ('Sherman', 'employee', true, NULL),
  ('Alvin', 'employee', true, NULL)
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Créer une fonction pour associer un profil à un user_id lors de la connexion
CREATE OR REPLACE FUNCTION public.link_profile_to_user(p_username text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET user_id = p_user_id, updated_at = now()
  WHERE username = p_username AND user_id IS NULL;
END;
$$;