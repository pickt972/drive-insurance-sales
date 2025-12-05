-- Add sender_email setting for verified domain emails
INSERT INTO system_settings (key, value, description)
VALUES ('sender_email', '"onboarding@resend.dev"', 'Email expéditeur pour les notifications (domaine Resend vérifié)')
ON CONFLICT (key) DO NOTHING;