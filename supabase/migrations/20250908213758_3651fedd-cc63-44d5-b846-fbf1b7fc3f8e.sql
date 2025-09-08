-- Corriger les politiques RLS pour insurance_types
DROP POLICY IF EXISTS "Everyone can view active insurance types" ON public.insurance_types;
DROP POLICY IF EXISTS "Users can view active insurance types" ON public.insurance_types;

-- Nouvelle politique pour permettre à tous les utilisateurs authentifiés de voir les types d'assurance actifs
CREATE POLICY "Users can view active insurance types" 
ON public.insurance_types 
FOR SELECT 
USING (
  (is_active = true) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Corriger les politiques RLS pour sales
DROP POLICY IF EXISTS "Users can view sales" ON public.sales;

-- Nouvelle politique pour les ventes
CREATE POLICY "Users can view their own sales or admins can view all" 
ON public.sales 
FOR SELECT 
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update and delete sales" ON public.sales;

-- Séparer les politiques pour plus de clarté
CREATE POLICY "Users can update their own sales or admins can update all" 
ON public.sales 
FOR UPDATE 
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete sales" 
ON public.sales 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);