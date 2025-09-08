-- Créer la table insurance_types
CREATE TABLE public.insurance_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table sales
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  reservation_number TEXT NOT NULL,
  insurance_type_id UUID NOT NULL REFERENCES public.insurance_types(id),
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur insurance_types
ALTER TABLE public.insurance_types ENABLE ROW LEVEL SECURITY;

-- Politiques pour insurance_types (tous peuvent lire, seuls les admins peuvent modifier)
CREATE POLICY "Everyone can view active insurance types" 
ON public.insurance_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage insurance types" 
ON public.insurance_types 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Activer RLS sur sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Politiques pour sales
CREATE POLICY "Users can view sales" 
ON public.sales 
FOR SELECT 
USING (
  employee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can create their own sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can update and delete sales" 
ON public.sales 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers pour updated_at
CREATE TRIGGER update_insurance_types_updated_at
  BEFORE UPDATE ON public.insurance_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les types d'assurance par défaut
INSERT INTO public.insurance_types (name, commission) VALUES
  ('Pneumatique', 4.50),
  ('Bris de glace', 7.90),
  ('Conducteur supplémentaire', 2.75),
  ('Protection vol', 5.20),
  ('Assistance dépannage', 3.80);