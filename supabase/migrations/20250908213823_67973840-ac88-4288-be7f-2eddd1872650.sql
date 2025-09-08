-- Supprimer toutes les politiques existantes et les recréer avec de nouveaux noms
DROP POLICY IF EXISTS "Everyone can view active insurance types" ON public.insurance_types;
DROP POLICY IF EXISTS "Users can view active insurance types" ON public.insurance_types;

-- Nouvelle politique pour insurance_types
CREATE POLICY "Authenticated users can view active insurance types" 
ON public.insurance_types 
FOR SELECT 
USING (
  (is_active = true) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Supprimer les politiques existantes pour sales
DROP POLICY IF EXISTS "Users can view sales" ON public.sales;
DROP POLICY IF EXISTS "Users can view their own sales or admins can view all" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales or admins can update all" ON public.sales;
DROP POLICY IF EXISTS "Admins can update and delete sales" ON public.sales;

-- Nouvelles politiques pour sales
CREATE POLICY "View sales policy" 
ON public.sales 
FOR SELECT 
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Update sales policy" 
ON public.sales 
FOR UPDATE 
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Delete sales policy" 
ON public.sales 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);