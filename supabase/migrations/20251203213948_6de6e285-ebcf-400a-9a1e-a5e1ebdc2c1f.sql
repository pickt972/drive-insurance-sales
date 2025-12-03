-- Add price_type column to insurance_types
ALTER TABLE public.insurance_types 
ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'forfait' 
CHECK (price_type IN ('forfait', 'per_day'));

-- Add comment for clarity
COMMENT ON COLUMN public.insurance_types.price_type IS 'Type de prix: forfait (prix fixe) ou per_day (prix par jour)';