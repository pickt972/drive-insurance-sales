-- CORRECTION CRITIQUE: Sécuriser les données sensibles
-- Supprimer les politiques RLS trop permissives sur la table sales

-- 1. Supprimer les politiques actuelles trop permissives
DROP POLICY IF EXISTS "Enable read access for all" ON sales;
DROP POLICY IF EXISTS "Enable insert access for all" ON sales;
DROP POLICY IF EXISTS "Enable update access for all" ON sales;
DROP POLICY IF EXISTS "Enable delete access for all" ON sales;

-- 2. Créer des politiques RLS sécurisées pour sales
CREATE POLICY "Authenticated users can view sales" 
ON sales FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sales" 
ON sales FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sales" 
ON sales FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sales" 
ON sales FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 3. Sécuriser sale_insurances de la même manière
DROP POLICY IF EXISTS "Enable read access for sale insurances" ON sale_insurances;
DROP POLICY IF EXISTS "Enable insert access for sale insurances" ON sale_insurances;
DROP POLICY IF EXISTS "Enable update access for sale insurances" ON sale_insurances;
DROP POLICY IF EXISTS "Enable delete access for sale insurances" ON sale_insurances;

CREATE POLICY "Authenticated users can view sale insurances" 
ON sale_insurances FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sale insurances" 
ON sale_insurances FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sale insurances" 
ON sale_insurances FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sale insurances" 
ON sale_insurances FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 4. Corriger les vues API en tant que SECURITY INVOKER (plus sûr)
DROP VIEW IF EXISTS api.profiles CASCADE;
DROP VIEW IF EXISTS api.insurance_types CASCADE;

-- Recréer sans SECURITY DEFINER (mode INVOKER par défaut)
CREATE VIEW api.profiles AS
SELECT id, user_id, username, role, is_active, created_at, updated_at
FROM public.profiles;

GRANT SELECT, INSERT, UPDATE, DELETE ON api.profiles TO postgres, anon, authenticated, service_role;

-- Règles pour rediriger les opérations vers la table publique
CREATE RULE profiles_insert AS
ON INSERT TO api.profiles
DO INSTEAD
  INSERT INTO public.profiles (id, user_id, username, role, is_active, created_at, updated_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.username,
    NEW.role,
    COALESCE(NEW.is_active, true),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING public.profiles.*;

CREATE RULE profiles_update AS
ON UPDATE TO api.profiles
DO INSTEAD
  UPDATE public.profiles
  SET
    user_id = NEW.user_id,
    username = NEW.username,
    role = NEW.role,
    is_active = NEW.is_active,
    updated_at = now()
  WHERE id = OLD.id
  RETURNING public.profiles.*;

CREATE RULE profiles_delete AS
ON DELETE TO api.profiles
DO INSTEAD
  DELETE FROM public.profiles
  WHERE id = OLD.id
  RETURNING public.profiles.*;

-- Vue insurance_types en lecture seule
CREATE VIEW api.insurance_types AS
SELECT id, name, commission, is_active, created_at, updated_at
FROM public.insurance_types;

GRANT SELECT ON api.insurance_types TO postgres, anon, authenticated, service_role;