-- Create a view in the api schema for objective_history
CREATE OR REPLACE VIEW api.objective_history AS 
SELECT * FROM public.objective_history;

-- Grant permissions on the view
GRANT SELECT ON api.objective_history TO authenticated;
GRANT ALL ON api.objective_history TO service_role;