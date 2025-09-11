-- Script de seeding pour recréer les données de base
-- Exécutez ce script pour restaurer les utilisateurs et types d'assurance

-- Supprimer les données existantes (optionnel)
-- DELETE FROM profiles WHERE username IN ('admin', 'Julie', 'Sherman', 'Alvin', 'Stef');

-- Insérer les types d'assurance de base
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
  is_active = EXCLUDED.is_active;

-- Note: Les utilisateurs doivent être créés via l'interface d'authentification
-- ou via le bouton "Créer les utilisateurs" dans l'application