-- Insérer les utilisateurs par défaut dans Supabase
-- D'abord, nous devons créer des comptes Supabase pour ces utilisateurs

-- Créer les profils pour les utilisateurs par défaut
-- Note: Les user_id sont générés aléatoirement pour cet exemple
-- En production, ils seraient créés lors de l'inscription

INSERT INTO profiles (user_id, username, role, is_active) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'admin', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'julie', 'employee', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'sherman', 'employee', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'alvin', 'employee', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'stef', 'employee', true)
ON CONFLICT (user_id) DO NOTHING;