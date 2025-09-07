-- Supprimer toutes les politiques INSERT existantes et recréer proprement
DROP POLICY IF EXISTS "Users can create their first profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles for others" ON public.profiles;

-- Politique unique et simple pour la création de profils
CREATE POLICY "Create profile policy" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- L'utilisateur peut créer son premier profil
  (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()))
  OR 
  -- Ou c'est un admin qui crée un profil pour quelqu'un d'autre
  public.is_admin()
);