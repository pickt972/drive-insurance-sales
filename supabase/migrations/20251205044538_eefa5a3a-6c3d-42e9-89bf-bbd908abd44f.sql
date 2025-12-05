-- Fix insecure RLS policies that check profiles.role directly
-- These should use the secure has_role() function instead

-- ============================================
-- FIX: sales table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can read all sales" ON public.sales;

CREATE POLICY "Admins can manage all sales" 
ON public.sales 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all sales" 
ON public.sales 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX: bonuses table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all bonuses" ON public.bonuses;

CREATE POLICY "Admins can manage all bonuses" 
ON public.bonuses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX: bonus_rules table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage bonus rules" ON public.bonus_rules;

CREATE POLICY "Admins can manage bonus rules" 
ON public.bonus_rules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX: employee_objectives table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all objectives" ON public.employee_objectives;

CREATE POLICY "Admins can manage all objectives" 
ON public.employee_objectives 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX: insurance_types table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage insurance types" ON public.insurance_types;
DROP POLICY IF EXISTS "Users can read active insurance types" ON public.insurance_types;

CREATE POLICY "Admins can manage insurance types" 
ON public.insurance_types 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read active insurance types" 
ON public.insurance_types 
FOR SELECT 
USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));