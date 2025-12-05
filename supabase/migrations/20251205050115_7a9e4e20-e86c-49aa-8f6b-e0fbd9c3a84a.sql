-- Add admin_reset_email setting if it doesn't exist
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'admin_reset_email',
  '"admin@aloelocation.com"',
  'Email de l''administrateur pour recevoir les demandes de réinitialisation de mot de passe'
)
ON CONFLICT (key) DO NOTHING;