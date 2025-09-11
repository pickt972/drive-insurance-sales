-- Créer directement les comptes d'authentification et les lier aux profils
-- Note: Cette requête doit être exécutée avec les privilèges administrateur

-- D'abord, supprimer le script automatique qui ne fonctionne pas
DO $$
DECLARE
    admin_user_id uuid;
    julie_user_id uuid;
    sherman_user_id uuid;
    alvin_user_id uuid;
BEGIN
    -- Vérifier si les utilisateurs d'authentification existent déjà
    -- Si non, ces UUID seront générés pour référence
    admin_user_id := gen_random_uuid();
    julie_user_id := gen_random_uuid();
    sherman_user_id := gen_random_uuid();
    alvin_user_id := gen_random_uuid();
    
    -- Mettre à jour les profils avec des user_id temporaires
    -- En attendant que les vrais comptes d'authentification soient créés
    UPDATE profiles SET 
        user_id = admin_user_id,
        updated_at = now()
    WHERE username = 'admin' AND user_id IS NULL;
    
    UPDATE profiles SET 
        user_id = julie_user_id,
        updated_at = now()
    WHERE username = 'Julie' AND user_id IS NULL;
    
    UPDATE profiles SET 
        user_id = sherman_user_id,
        updated_at = now()
    WHERE username = 'Sherman' AND user_id IS NULL;
    
    UPDATE profiles SET 
        user_id = alvin_user_id,
        updated_at = now()
    WHERE username = 'Alvin' AND user_id IS NULL;

    RAISE NOTICE 'Profils mis à jour avec des UUID temporaires. Les comptes d''authentification doivent être créés manuellement.';
END $$;