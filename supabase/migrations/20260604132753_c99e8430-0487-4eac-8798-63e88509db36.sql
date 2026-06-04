
CREATE OR REPLACE FUNCTION public.prevent_duplicate_insurance_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user UUID;
  existing_name TEXT;
  skip_check TEXT;
BEGIN
  BEGIN
    skip_check := current_setting('app.skip_duplicate_check', true);
  EXCEPTION WHEN OTHERS THEN
    skip_check := NULL;
  END;
  IF skip_check = 'on' THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION public.restore_insurance_sale(sale_data jsonb)
RETURNS public.insurance_sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restored public.insurance_sales;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can restore sales';
  END IF;

  PERFORM set_config('app.skip_duplicate_check', 'on', true);

  INSERT INTO public.insurance_sales (
    id, user_id, insurance_type_id, contract_number, client_name, client_phone,
    vehicle_registration, amount, commission_amount, sale_date, agency, status, notes, created_at, updated_at
  )
  VALUES (
    COALESCE((sale_data->>'id')::uuid, gen_random_uuid()),
    (sale_data->>'user_id')::uuid,
    (sale_data->>'insurance_type_id')::uuid,
    sale_data->>'contract_number',
    sale_data->>'client_name',
    sale_data->>'client_phone',
    sale_data->>'vehicle_registration',
    COALESCE((sale_data->>'amount')::numeric, 0),
    COALESCE((sale_data->>'commission_amount')::numeric, 0),
    COALESCE((sale_data->>'sale_date')::date, CURRENT_DATE),
    sale_data->>'agency',
    COALESCE(sale_data->>'status', 'validated'),
    sale_data->>'notes',
    COALESCE((sale_data->>'created_at')::timestamptz, now()),
    now()
  )
  RETURNING * INTO restored;

  PERFORM set_config('app.skip_duplicate_check', 'off', true);

  RETURN restored;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_insurance_sale(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_insurance_sale(jsonb) TO authenticated;
