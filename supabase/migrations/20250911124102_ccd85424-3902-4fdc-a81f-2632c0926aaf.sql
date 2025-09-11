-- Lier les profils existants aux comptes d'authentification créés
-- Cette migration met à jour les profils avec les user_id des comptes auth créés

-- Récupérer les UUID des utilisateurs d'authentification et les lier aux profils
DO $$
DECLARE
    admin_user_id uuid;
    julie_user_id uuid;
    sherman_user_id uuid;
    alvin_user_id uuid;
BEGIN
    -- Récupérer les user_id des comptes d'authentification par email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@aloelocation.com' 
    LIMIT 1;
    
    SELECT id INTO julie_user_id 
    FROM auth.users 
    WHERE email = 'julie@aloelocation.com' 
    LIMIT 1;
    
    SELECT id INTO sherman_user_id 
    FROM auth.users 
    WHERE email = 'sherman@aloelocation.com' 
    LIMIT 1;
    
    SELECT id INTO alvin_user_id 
    FROM auth.users 
    WHERE email = 'alvin@aloelocation.com' 
    LIMIT 1;
    
    -- Lier les profils aux comptes d'authentification
    IF admin_user_id IS NOT NULL THEN
        UPDATE profiles SET 
            user_id = admin_user_id,
            updated_at = now()
        WHERE username = 'admin';
        RAISE NOTICE 'Profil admin lié à %', admin_user_id;
    END IF;
    
    IF julie_user_id IS NOT NULL THEN
        UPDATE profiles SET 
            user_id = julie_user_id,
            updated_at = now()
        WHERE username = 'Julie';
        RAISE NOTICE 'Profil Julie lié à %', julie_user_id;
    END IF;
    
    IF sherman_user_id IS NOT NULL THEN
        UPDATE profiles SET 
            user_id = sherman_user_id,
            updated_at = now()
        WHERE username = 'Sherman';
        RAISE NOTICE 'Profil Sherman lié à %', sherman_user_id;
    END IF;
    
    IF alvin_user_id IS NOT NULL THEN
        UPDATE profiles SET 
            user_id = alvin_user_id,
            updated_at = now()
        WHERE username = 'Alvin';
        RAISE NOTICE 'Profil Alvin lié à %', alvin_user_id;
    END IF;
    
    -- Vérifier les profils non liés
    RAISE NOTICE 'Profils restants sans user_id: %', (
        SELECT string_agg(username, ', ') 
        FROM profiles 
        WHERE user_id IS NULL
    );
END $$;