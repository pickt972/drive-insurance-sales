-- Recréer les utilisateurs manquants dans le système
-- Note: Ces utilisateurs devront se connecter via l'interface pour activer leur compte

-- Insérer les profils des utilisateurs manquants
-- L'UUID sera généré automatiquement, le user_id sera mis à jour lors de la première connexion

INSERT INTO profiles (username, role, is_active) 
VALUES 
  ('admin', 'admin', true),
  ('Julie', 'employee', true),
  ('Sherman', 'employee', true),
  ('Alvin', 'employee', true)
ON CONFLICT (username) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Vérifier que tous les types d'assurance sont présents
INSERT INTO insurance_types (id, name, commission, is_active) 
VALUES 
  ('60520319-5d56-48ac-912a-5df13969e786', 'Protection vol', 5.20, true),
  ('7bf4711c-c001-4b7f-8cb7-d1ba86777901', 'Assistance dépannage', 1.50, true),
  ('843783f5-97a9-4c97-9562-e001c575e925', 'Bris de glace', 1.50, true),
  ('b7d4743b-6df1-40d3-9c98-c92b3fa7cfa4', 'Conducteur supplémentaire', 1.50, true),
  ('36b2a177-e0e9-462a-b42a-66d572e91931', 'Pneumatique', 1.50, true),
  ('efb6c5ed-8a3c-4353-96fd-824373c3bbb6', 'Rachat Partiel de franchise', 2.00, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  commission = EXCLUDED.commission,
  is_active = EXCLUDED.is_active,
  updated_at = now();