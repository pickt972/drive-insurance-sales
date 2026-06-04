DROP TRIGGER IF EXISTS trg_log_insurance_sales_changes ON public.insurance_sales;
CREATE TRIGGER trg_log_insurance_sales_changes
AFTER INSERT OR UPDATE OR DELETE ON public.insurance_sales
FOR EACH ROW EXECUTE FUNCTION public.log_insurance_sales_changes();