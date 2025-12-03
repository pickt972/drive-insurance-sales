-- Update calculate_commission function to use fixed amount if defined
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fixed_commission numeric;
  rate numeric;
BEGIN
  IF NEW.insurance_type_id IS NOT NULL THEN
    -- Get both commission_amount (fixed) and commission_rate from insurance type
    SELECT 
      COALESCE(commission_amount, 0),
      COALESCE(commission_rate, 0)
    INTO fixed_commission, rate
    FROM insurance_types 
    WHERE id = NEW.insurance_type_id;
    
    -- Use fixed amount if > 0, otherwise calculate from rate
    IF fixed_commission > 0 THEN
      NEW.commission_amount := fixed_commission;
    ELSE
      NEW.commission_amount := ROUND((NEW.amount * rate / 100), 2);
    END IF;
  END IF;
  
  IF NEW.commission_amount IS NULL THEN
    NEW.commission_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;