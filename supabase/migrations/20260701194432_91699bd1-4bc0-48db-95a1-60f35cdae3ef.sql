
-- 1. user_roles: drop overly permissive "Service role can manage all" (USING true, WITH CHECK true)
DROP POLICY IF EXISTS "Service role can manage all" ON public.user_roles;
-- Admin management policy
CREATE POLICY "Admins manage user_roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. bonus_rules: drop public-readable policy
DROP POLICY IF EXISTS "Tous voient les règles de bonus" ON public.bonus_rules;

-- 3. Fix search_path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 4. Revoke EXECUTE from PUBLIC and anon on all SECURITY DEFINER functions;
--    revoke from authenticated on trigger-only functions.

-- Trigger-only functions: revoke from anon + authenticated + PUBLIC
REVOKE ALL ON FUNCTION public.calculate_commission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_insurance_sales_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_table_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_duplicate_insurance_sale() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- Helper functions used by RLS: revoke from anon and PUBLIC, keep authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_manager(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_manager(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- RPC callable by authenticated admins only (checked inside the function)
REVOKE ALL ON FUNCTION public.restore_insurance_sale(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_insurance_sale(jsonb) TO authenticated;

-- 5. Storage: remove broad SELECT that allowed listing app-assets bucket contents.
-- Files remain fetchable via direct URL because the bucket is public.
DROP POLICY IF EXISTS "Public can view app assets" ON storage.objects;
