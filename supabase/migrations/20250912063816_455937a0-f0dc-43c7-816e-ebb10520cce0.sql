-- Create RPC function that can be called from the api schema
CREATE OR REPLACE FUNCTION api.archive_completed_objective(
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
BEGIN
  -- Call the existing function in the public schema
  PERFORM public.archive_completed_objective(
    p_objective_id,
    p_achieved_amount,
    p_achieved_sales_count,
    p_progress_percentage_amount,
    p_progress_percentage_sales,
    p_objective_achieved
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api.archive_completed_objective TO authenticated;