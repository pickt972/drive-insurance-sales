-- Create table for objective history
CREATE TABLE public.objective_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  objective_type TEXT NOT NULL CHECK (objective_type IN ('monthly', 'weekly', 'yearly')),
  target_amount NUMERIC NOT NULL DEFAULT 0,
  target_sales_count INTEGER NOT NULL DEFAULT 0,
  achieved_amount NUMERIC NOT NULL DEFAULT 0,
  achieved_sales_count INTEGER NOT NULL DEFAULT 0,
  progress_percentage_amount NUMERIC NOT NULL DEFAULT 0,
  progress_percentage_sales NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  objective_achieved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.objective_history ENABLE ROW LEVEL SECURITY;

-- Create policies for objective history
CREATE POLICY "Employees can view their own objective history" 
ON public.objective_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND (p.role = 'admin' OR p.username = objective_history.employee_name)
));

CREATE POLICY "Admins can manage all objective history" 
ON public.objective_history 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'
));

-- Create index for better performance
CREATE INDEX idx_objective_history_employee_date ON public.objective_history(employee_name, period_start, period_end);
CREATE INDEX idx_objective_history_archived_at ON public.objective_history(archived_at);

-- Create function to archive completed objectives
CREATE OR REPLACE FUNCTION public.archive_completed_objective(
  p_objective_id UUID,
  p_achieved_amount NUMERIC,
  p_achieved_sales_count INTEGER,
  p_progress_percentage_amount NUMERIC,
  p_progress_percentage_sales NUMERIC,
  p_objective_achieved BOOLEAN
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  objective_record RECORD;
BEGIN
  -- Get the objective details
  SELECT * INTO objective_record
  FROM employee_objectives
  WHERE id = p_objective_id AND is_active = true;
  
  IF objective_record.id IS NOT NULL THEN
    -- Insert into history
    INSERT INTO objective_history (
      employee_name,
      objective_type,
      target_amount,
      target_sales_count,
      achieved_amount,
      achieved_sales_count,
      progress_percentage_amount,
      progress_percentage_sales,
      period_start,
      period_end,
      description,
      is_completed,
      objective_achieved
    ) VALUES (
      objective_record.employee_name,
      objective_record.objective_type,
      objective_record.target_amount,
      objective_record.target_sales_count,
      p_achieved_amount,
      p_achieved_sales_count,
      p_progress_percentage_amount,
      p_progress_percentage_sales,
      objective_record.period_start,
      objective_record.period_end,
      objective_record.description,
      true,
      p_objective_achieved
    );
    
    -- Mark the objective as inactive
    UPDATE employee_objectives
    SET is_active = false, updated_at = now()
    WHERE id = p_objective_id;
  END IF;
END;
$$;