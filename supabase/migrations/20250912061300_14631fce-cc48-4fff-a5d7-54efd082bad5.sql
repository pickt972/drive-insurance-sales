-- Ensure api schema exists
CREATE SCHEMA IF NOT EXISTS api;

-- Create employee_objectives table in api schema if missing
CREATE TABLE IF NOT EXISTS api.employee_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  objective_type TEXT NOT NULL DEFAULT 'monthly',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  target_sales_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE api.employee_objectives ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Employees can view their own objectives" ON api.employee_objectives;
CREATE POLICY "Employees can view their own objectives"
ON api.employee_objectives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM api.profiles p
    WHERE p.user_id = auth.uid()
      AND (p.role = 'admin' OR p.username = employee_objectives.employee_name)
  )
);

DROP POLICY IF EXISTS "Admins can manage all objectives" ON api.employee_objectives;
CREATE POLICY "Admins can manage all objectives"
ON api.employee_objectives
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM api.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Trigger to auto update updated_at
DROP TRIGGER IF EXISTS update_employee_objectives_updated_at ON api.employee_objectives;
CREATE TRIGGER update_employee_objectives_updated_at
BEFORE UPDATE ON api.employee_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();