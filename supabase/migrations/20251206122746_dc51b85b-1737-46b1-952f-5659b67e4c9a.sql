-- Mettre à jour la politique INSERT sur insurance_sales pour permettre aux admins d'insérer pour d'autres utilisateurs
DROP POLICY IF EXISTS "Utilisateurs créent leurs ventes" ON public.insurance_sales;

CREATE POLICY "Utilisateurs créent leurs ventes" 
ON public.insurance_sales 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);