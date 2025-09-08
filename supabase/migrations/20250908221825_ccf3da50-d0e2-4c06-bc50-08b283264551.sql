-- Create a junction table for sales and insurance types (many-to-many relationship)
CREATE TABLE public.sale_insurances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL,
  insurance_type_id UUID NOT NULL,
  commission_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sale_id, insurance_type_id)
);

-- Add foreign key constraints
ALTER TABLE public.sale_insurances 
ADD CONSTRAINT sale_insurances_sale_id_fkey 
FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

ALTER TABLE public.sale_insurances 
ADD CONSTRAINT sale_insurances_insurance_type_id_fkey 
FOREIGN KEY (insurance_type_id) REFERENCES public.insurance_types(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.sale_insurances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sale_insurances
CREATE POLICY "Users can view their sale insurances" 
ON public.sale_insurances 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_insurances.sale_id 
    AND (sales.employee_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  )
);

CREATE POLICY "Users can create sale insurances for their sales" 
ON public.sale_insurances 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_insurances.sale_id 
    AND sales.employee_id = auth.uid()
  )
);

CREATE POLICY "Users can update their sale insurances" 
ON public.sale_insurances 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_insurances.sale_id 
    AND (sales.employee_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  )
);

CREATE POLICY "Users can delete their sale insurances" 
ON public.sale_insurances 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_insurances.sale_id 
    AND (sales.employee_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  )
);

-- Create a view to expose sale_insurances in the API schema
CREATE OR REPLACE VIEW api.sale_insurances AS
SELECT id, sale_id, insurance_type_id, commission_amount, created_at
FROM public.sale_insurances;

-- Grant privileges on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON api.sale_insurances TO authenticated;