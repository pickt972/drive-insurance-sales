-- Créer la table des objectifs pour les employés
CREATE TABLE public.employee_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  objective_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', 'yearly'
  target_amount NUMERIC NOT NULL DEFAULT 0,
  target_sales_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table des objectifs
ALTER TABLE public.employee_objectives ENABLE ROW LEVEL SECURITY;

-- Politique pour que les employés ne voient que leurs propres objectifs
CREATE POLICY "Employees can view their own objectives" 
ON public.employee_objectives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND (p.role = 'admin' OR p.username = employee_name)
  )
);

-- Politique pour que les admins puissent gérer tous les objectifs
CREATE POLICY "Admins can manage all objectives" 
ON public.employee_objectives 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER update_employee_objectives_updated_at
BEFORE UPDATE ON public.employee_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();