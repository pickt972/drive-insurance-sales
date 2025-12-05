-- Supprimer la politique qui expose tous les rôles
DROP POLICY IF EXISTS "Users view own role" ON public.user_roles;

-- Vérifier que la politique correcte existe
-- (Users can read own role avec USING (auth.uid() = user_id))