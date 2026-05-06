
-- Generic audit trigger function reusable for any table
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email_val TEXT;
  rec_id UUID;
BEGIN
  SELECT email INTO user_email_val FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'DELETE' THEN
    BEGIN rec_id := (to_jsonb(OLD)->>'id')::uuid; EXCEPTION WHEN others THEN rec_id := NULL; END;
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_values)
    VALUES (auth.uid(), user_email_val, 'DELETE', TG_TABLE_NAME, rec_id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    BEGIN rec_id := (to_jsonb(NEW)->>'id')::uuid; EXCEPTION WHEN others THEN rec_id := NULL; END;
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), user_email_val, 'UPDATE', TG_TABLE_NAME, rec_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    BEGIN rec_id := (to_jsonb(NEW)->>'id')::uuid; EXCEPTION WHEN others THEN rec_id := NULL; END;
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, new_values)
    VALUES (auth.uid(), user_email_val, 'INSERT', TG_TABLE_NAME, rec_id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach to sensitive tables
DROP TRIGGER IF EXISTS audit_bonus_rules ON public.bonus_rules;
CREATE TRIGGER audit_bonus_rules AFTER INSERT OR UPDATE OR DELETE ON public.bonus_rules
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_bonuses ON public.bonuses;
CREATE TRIGGER audit_bonuses AFTER INSERT OR UPDATE OR DELETE ON public.bonuses
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_employee_objectives ON public.employee_objectives;
CREATE TRIGGER audit_employee_objectives AFTER INSERT OR UPDATE OR DELETE ON public.employee_objectives
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_objectives ON public.objectives;
CREATE TRIGGER audit_objectives AFTER INSERT OR UPDATE OR DELETE ON public.objectives
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_insurance_types ON public.insurance_types;
CREATE TRIGGER audit_insurance_types AFTER INSERT OR UPDATE OR DELETE ON public.insurance_types
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_system_settings ON public.system_settings;
CREATE TRIGGER audit_system_settings AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();
