
-- 1. Add 'manager' role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- 2. Helper functions (use text cast so they work even in the same tx as ADD VALUE)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'manager'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin','manager')
  )
$$;

-- 3. Update get_user_role to also recognise manager (already returns whatever text is in profiles.role)
-- No change needed – it reads the text column directly.

-- 4. Extend RLS so managers can operate
-- Sales (read-only for managers)
CREATE POLICY "Managers voient toutes les ventes"
ON public.insurance_sales FOR SELECT
USING (public.is_manager(auth.uid()));

-- Objectives management
CREATE POLICY "Managers gèrent les objectifs employés"
ON public.employee_objectives FOR ALL
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers gèrent les objectifs"
ON public.objectives FOR ALL
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

-- Bonuses (read + update to approve/pay, no delete)
CREATE POLICY "Managers voient toutes les primes"
ON public.bonuses FOR SELECT
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers modifient les primes"
ON public.bonuses FOR UPDATE
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers créent des primes"
ON public.bonuses FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));

-- Bonus rules & insurance types & settings (read)
CREATE POLICY "Managers voient les règles bonus"
ON public.bonus_rules FOR SELECT
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers voient les types d'assurance"
ON public.insurance_types FOR SELECT
USING (public.is_manager(auth.uid()));

-- Audit logs
CREATE POLICY "Managers voient les logs"
ON public.audit_logs FOR SELECT
USING (public.is_manager(auth.uid()));

-- Profiles: managers can see all, and create/update non-admin/non-manager users
CREATE POLICY "Managers voient tous les profils"
ON public.profiles FOR SELECT
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers créent des employés"
ON public.profiles FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers modifient les employés"
ON public.profiles FOR UPDATE
USING (
  public.is_manager(auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.id AND ur.role::text IN ('admin','manager')
  )
)
WITH CHECK (
  public.is_manager(auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.id AND ur.role::text IN ('admin','manager')
  )
);
