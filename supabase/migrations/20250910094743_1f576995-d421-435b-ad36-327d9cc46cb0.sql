-- Supprimer toutes les politiques dépendantes de employee_id sur sales
DROP POLICY IF EXISTS "Users can create their own sales" ON public.sales;
DROP POLICY IF EXISTS "Enable read access for sales owners and admins" ON public.sales;
DROP POLICY IF EXISTS "Enable update access for sales owners and admins" ON public.sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Enable delete access for admins only" ON public.sales;

-- Supprimer les politiques sur sale_insurances qui dépendent de employee_id dans sales
DROP POLICY IF EXISTS "Users can view their sale insurances" ON public.sale_insurances;
DROP POLICY IF EXISTS "Users can create sale insurances for their sales" ON public.sale_insurances;
DROP POLICY IF EXISTS "Users can update their sale insurances" ON public.sale_insurances;
DROP POLICY IF EXISTS "Users can delete their sale insurances" ON public.sale_insurances;

-- Ajouter la nouvelle colonne employee_name
ALTER TABLE public.sales ADD COLUMN employee_name TEXT;

-- Pour les données existantes, utiliser un nom par défaut (s'il y en a)
UPDATE public.sales SET employee_name = 'Unknown' WHERE employee_name IS NULL;

-- Rendre employee_name obligatoire
ALTER TABLE public.sales ALTER COLUMN employee_name SET NOT NULL;

-- Maintenant supprimer employee_id avec CASCADE pour supprimer les vues dépendantes
ALTER TABLE public.sales DROP COLUMN employee_id CASCADE;

-- Recréer les politiques RLS simplifiées (sans vérification d'utilisateur pour l'instant)
CREATE POLICY "Enable read access for all" 
ON public.sales 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all" 
ON public.sales 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all" 
ON public.sales 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all" 
ON public.sales 
FOR DELETE 
USING (true);

-- Recréer les politiques pour sale_insurances sans référence à employee_id
CREATE POLICY "Enable read access for sale insurances" 
ON public.sale_insurances 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for sale insurances" 
ON public.sale_insurances 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for sale insurances" 
ON public.sale_insurances 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for sale insurances" 
ON public.sale_insurances 
FOR DELETE 
USING (true);