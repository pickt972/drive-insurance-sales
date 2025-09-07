-- Simplifier les politiques pour permettre la création du premier profil
-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create initial profile if none exists" ON public.profiles;

-- Nouvelle politique simple: permettre la création si c'est le premier profil de l'utilisateur
CREATE POLICY "Users can create their first profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);

-- Les admins peuvent créer des profils pour d'autres utilisateurs
CREATE POLICY "Admins can create profiles for others" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  public.is_admin() OR (
    auth.uid() = user_id AND 
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
  )
);