-- Migration pour backfill les assurances des anciennes ventes
-- Insérer les assurances principales des ventes existantes dans sale_insurances
INSERT INTO sale_insurances (sale_id, insurance_type_id, commission_amount)
SELECT 
  s.id as sale_id,
  s.insurance_type_id,
  s.commission_amount
FROM sales s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM sale_insurances si 
    WHERE si.sale_id = s.id 
      AND si.insurance_type_id = s.insurance_type_id
  );