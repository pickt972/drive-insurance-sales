ALTER TABLE public.bonus_rules
  ADD COLUMN IF NOT EXISTS tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS base text NOT NULL DEFAULT 'sales_amount',
  ADD COLUMN IF NOT EXISTS calculation_mode text NOT NULL DEFAULT 'highest',
  ADD COLUMN IF NOT EXISTS bonus_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.bonus_rules
  ALTER COLUMN min_achievement_percent DROP NOT NULL,
  ALTER COLUMN bonus_percent DROP NOT NULL;

ALTER TABLE public.bonus_rules
  ADD CONSTRAINT bonus_rules_base_check CHECK (base IN ('sales_amount','sales_count','commission')),
  ADD CONSTRAINT bonus_rules_mode_check CHECK (calculation_mode IN ('highest','cumulative')),
  ADD CONSTRAINT bonus_rules_bonus_type_check CHECK (bonus_type IN ('fixed','percent'));