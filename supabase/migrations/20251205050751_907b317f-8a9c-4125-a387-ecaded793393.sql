-- Create trigger function for audit logging on insurance_sales
CREATE OR REPLACE FUNCTION log_insurance_sales_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email_val TEXT;
BEGIN
  -- Get the email of the current user
  SELECT email INTO user_email_val FROM auth.users WHERE id = auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, new_values)
    VALUES (auth.uid(), user_email_val, 'INSERT', 'insurance_sales', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), user_email_val, 'UPDATE', 'insurance_sales', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_values)
    VALUES (auth.uid(), user_email_val, 'DELETE', 'insurance_sales', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS audit_insurance_sales ON insurance_sales;

-- Create trigger for all operations
CREATE TRIGGER audit_insurance_sales
  AFTER INSERT OR UPDATE OR DELETE ON insurance_sales
  FOR EACH ROW EXECUTE FUNCTION log_insurance_sales_changes();