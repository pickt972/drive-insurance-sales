-- Supprimer la fonction problématique
DROP FUNCTION IF EXISTS public.is_admin();

-- Supprimer la politique actuelle qui utilise cette fonction
DROP POLICY IF EXISTS "Create profile policy" ON public.profiles;

-- Créer une politique simple sans fonction personnalisée
CREATE POLICY "Users can create their first profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);

-- Modifier la politique admin existante pour ne pas utiliser de fonction
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);