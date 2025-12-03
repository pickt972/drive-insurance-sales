-- Update calculate_commission to only use fixed amount
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.insurance_type_id IS NOT NULL THEN
    -- Get fixed commission_amount from insurance type
    SELECT COALESCE(commission_amount, 0)
    INTO NEW.commission_amount
    FROM insurance_types 
    WHERE id = NEW.insurance_type_id;
  END IF;
  
  IF NEW.commission_amount IS NULL THEN
    NEW.commission_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;