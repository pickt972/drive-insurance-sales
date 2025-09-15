-- Créer un utilisateur administrateur dans la table profiles
INSERT INTO public.profiles (username, role, is_active, user_id) 
VALUES ('admin', 'admin', true, gen_random_uuid());

-- Mettre à jour le rôle de Sherman pour en faire un admin (par exemple)
UPDATE public.profiles 
SET role = 'admin' 
WHERE username = 'Sherman';