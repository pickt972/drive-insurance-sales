-- Supprimer la politique actuelle qui permet aux utilisateurs de créer leur propre profil
DROP POLICY "Users can create their own profile" ON public.profiles;

-- Créer une fonction sécurisée pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Nouvelle politique : seuls les administrateurs peuvent créer des profils
CREATE POLICY "Only admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_admin());

-- Politique pour permettre aux utilisateurs de créer leur profil initial SI aucun profil n'existe encore
CREATE POLICY "Users can create initial profile if none exists" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);