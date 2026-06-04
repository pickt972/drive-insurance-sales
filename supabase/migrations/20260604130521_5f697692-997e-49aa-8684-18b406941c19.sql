
CREATE OR REPLACE FUNCTION public.prevent_duplicate_insurance_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user UUID;
  existing_name TEXT;
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' OR NEW.insurance_type_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT s.user_id, p.full_name
    INTO existing_user, existing_name
  FROM public.insurance_sales s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.contract_number = NEW.contract_number
    AND s.insurance_type_id = NEW.insurance_type_id
    AND (TG_OP = 'INSERT' OR s.id <> NEW.id)
  LIMIT 1;

  IF existing_user IS NOT NULL THEN
    RAISE EXCEPTION 'DUPLICATE_SALE: Cette prestation (dossier %) a déjà été enregistrée par %', NEW.contract_number, COALESCE(existing_name, 'un autre utilisateur')
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_insurance_sale_trigger ON public.insurance_sales;
CREATE TRIGGER prevent_duplicate_insurance_sale_trigger
BEFORE INSERT OR UPDATE OF contract_number, insurance_type_id ON public.insurance_sales
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_insurance_sale();
