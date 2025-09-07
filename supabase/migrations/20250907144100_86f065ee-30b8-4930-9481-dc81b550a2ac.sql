-- Supprimer la politique qui dépend de la fonction
DROP POLICY IF EXISTS "Create profile policy" ON public.profiles;

-- Maintenant supprimer la fonction
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Créer une politique simple sans fonction personnalisée
CREATE POLICY "Users can create their first profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);