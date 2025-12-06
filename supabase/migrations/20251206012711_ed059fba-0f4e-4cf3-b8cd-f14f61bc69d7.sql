-- Fix 1: Remove permissive INSERT policy on audit_logs
-- Audit logs should only be created by SECURITY DEFINER triggers
DROP POLICY IF EXISTS "Système crée les logs" ON audit_logs;

-- Fix 2: Restrict system_settings access - hide sensitive settings from non-admins
DROP POLICY IF EXISTS "Tous lisent les paramètres" ON system_settings;

CREATE POLICY "Users read non-sensitive settings" ON system_settings
FOR SELECT USING (
  key NOT IN ('admin_reset_email', 'sender_email', 'smtp_settings', 'smtp_password')
  OR has_role(auth.uid(), 'admin'::app_role)
);