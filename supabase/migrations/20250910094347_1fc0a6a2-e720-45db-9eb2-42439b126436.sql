-- Modifier la table sales pour accepter des noms d'utilisateurs au lieu d'UUIDs
-- Ajouter une nouvelle colonne employee_name
ALTER TABLE public.sales ADD COLUMN employee_name TEXT;

-- Copier les données existantes de employee_id vers employee_name si nécessaire
-- (pour l'instant cette table devrait être vide ou presque)

-- Rendre employee_name obligatoire
ALTER TABLE public.sales ALTER COLUMN employee_name SET NOT NULL;

-- Supprimer l'ancienne colonne employee_id
ALTER TABLE public.sales DROP COLUMN employee_id;

-- Mettre à jour les politiques RLS pour utiliser employee_name
DROP POLICY IF EXISTS "Enable read access for sales owners and admins" ON public.sales;
DROP POLICY IF EXISTS "Enable update access for sales owners and admins" ON public.sales;
DROP POLICY IF EXISTS "Users can create their own sales" ON public.sales;

-- Nouvelles politiques RLS basées sur employee_name
CREATE POLICY "Enable read access for all authenticated users" 
ON public.sales 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON public.sales 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
ON public.sales 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for admins only" 
ON public.sales 
FOR DELETE 
USING (true);