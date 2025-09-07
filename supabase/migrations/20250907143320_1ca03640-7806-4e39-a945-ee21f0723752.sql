-- Ajouter une politique pour permettre aux utilisateurs de créer leur propre profil
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);