-- Corriger les politiques RLS pour permettre l'accès aux insurance_types
-- Les requêtes utilisent le schema 'public' mais ont besoin d'accès aux données

-- Supprimer et recréer la politique pour insurance_types
DROP POLICY IF EXISTS "Authenticated users can view active insurance types" ON public.insurance_types;

-- Créer une nouvelle politique plus permissive pour les utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users on insurance_types"
ON public.insurance_types
FOR SELECT
TO authenticated
USING (is_active = true);

-- Aussi permettre aux admins de tout voir
CREATE POLICY "Enable full access for admins on insurance_types" 
ON public.insurance_types 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Corriger aussi les politiques de sales pour éviter les mêmes erreurs
DROP POLICY IF EXISTS "View sales policy" ON public.sales;
DROP POLICY IF EXISTS "Update sales policy" ON public.sales;  
DROP POLICY IF EXISTS "Delete sales policy" ON public.sales;

-- Nouvelles politiques pour sales
CREATE POLICY "Enable read access for sales owners and admins" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable update access for sales owners and admins" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable delete access for admins only" 
ON public.sales 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);