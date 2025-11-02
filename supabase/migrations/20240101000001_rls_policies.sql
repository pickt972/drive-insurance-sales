-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User roles policies
-- Users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all roles
CREATE POLICY "Admins can read all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insurance types policies
-- All authenticated users can read active insurance types
CREATE POLICY "Authenticated users can read insurance types"
  ON public.insurance_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage insurance types
CREATE POLICY "Admins can insert insurance types"
  ON public.insurance_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update insurance types"
  ON public.insurance_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete insurance types"
  ON public.insurance_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Sales policies
-- Users can read their own sales
CREATE POLICY "Users can read own sales"
  ON public.sales
  FOR SELECT
  USING (
    employee_name = (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can read all sales
CREATE POLICY "Admins can read all sales"
  ON public.sales
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own sales
CREATE POLICY "Users can insert own sales"
  ON public.sales
  FOR INSERT
  WITH CHECK (
    employee_name = (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update their own sales
CREATE POLICY "Users can update own sales"
  ON public.sales
  FOR UPDATE
  USING (
    employee_name = (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can update all sales
CREATE POLICY "Admins can update all sales"
  ON public.sales
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete their own sales
CREATE POLICY "Users can delete own sales"
  ON public.sales
  FOR DELETE
  USING (
    employee_name = (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can delete all sales
CREATE POLICY "Admins can delete all sales"
  ON public.sales
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Sale insurances policies
-- Users can read sale insurances for their sales
CREATE POLICY "Users can read own sale insurances"
  ON public.sale_insurances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_id
      AND s.employee_name = (
        SELECT username FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can read all sale insurances
CREATE POLICY "Admins can read all sale insurances"
  ON public.sale_insurances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert sale insurances for their sales
CREATE POLICY "Users can insert own sale insurances"
  ON public.sale_insurances
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_id
      AND s.employee_name = (
        SELECT username FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can insert all sale insurances
CREATE POLICY "Admins can insert all sale insurances"
  ON public.sale_insurances
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete sale insurances for their sales
CREATE POLICY "Users can delete own sale insurances"
  ON public.sale_insurances
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_id
      AND s.employee_name = (
        SELECT username FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can delete all sale insurances
CREATE POLICY "Admins can delete all sale insurances"
  ON public.sale_insurances
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Objectives policies
-- Users can read their own objectives
CREATE POLICY "Users can read own objectives"
  ON public.objectives
  FOR SELECT
  USING (
    employee_name = (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can read all objectives
CREATE POLICY "Admins can read all objectives"
  ON public.objectives
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage objectives
CREATE POLICY "Admins can insert objectives"
  ON public.objectives
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update objectives"
  ON public.objectives
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete objectives"
  ON public.objectives
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
