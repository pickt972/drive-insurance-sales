-- Add commission_amount column for fixed euro commission
ALTER TABLE public.insurance_types 
ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.insurance_types.commission_amount IS 'Commission fixe en euros (si > 0, utilisé à la place du taux)';
COMMENT ON COLUMN public.insurance_types.commission_rate IS 'Taux de commission en pourcentage';