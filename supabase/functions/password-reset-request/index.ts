import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetRequestBody {
  username: string;
  origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, origin }: ResetRequestBody = await req.json();
    const inputUsername = (username || '').trim();
    console.log('Reset request for username:', inputUsername);

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client with API schema
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: { 
          schema: 'api' 
        }
      }
    );

    // Find user profile using API schema
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, username')
      .ilike('username', inputUsername)
      .maybeSingle();

    if (profileError) {
      console.log('Database error while fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erreur de base de données' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.log('Profile not found for username:', inputUsername);
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile has a user_id linked
    if (!profile.user_id) {
      console.log('Profile not linked to auth user for username:', inputUsername);
      return new Response(
        JSON.stringify({ error: 'Compte non activé. Utilisez le bouton "Créer les utilisateurs" dans l\'administration pour activer ce compte.' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email from auth.users using admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);

    if (authError || !authUser.user?.email) {
      console.log('Auth user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'Email utilisateur non trouvé' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token using API function
    const { error: tokenError } = await supabaseAdmin.rpc('create_password_reset_token', {
      p_user_id: profile.user_id,
      p_username: inputUsername,
      p_token: resetToken,
      p_expires_at: expiresAt.toISOString()
    });

    if (tokenError) {
      console.log('Error storing token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du token' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email with reset link
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const resetUrl = `${origin}/reset-password?token=${resetToken}&username=${encodeURIComponent(inputUsername)}`;

    const emailResponse = await resend.emails.send({
      from: "Aloelocation <onboarding@resend.dev>",
      to: ["alocationcloud@gmail.com"],
      subject: `Réinitialisation de mot de passe pour ${inputUsername}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Demande de réinitialisation de mot de passe</h1>
          <p>Bonjour Administrateur,</p>
          <p>L'utilisateur <strong>${inputUsername}</strong> (${authUser.user.email}) a demandé la réinitialisation de son mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser le mot de passe de ${inputUsername}
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            <strong>Détails de la demande :</strong><br/>
            • Utilisateur : ${inputUsername}<br/>
            • Email : ${authUser.user.email}<br/>
            • Date : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </p>
          <p style="color: #666; font-size: 14px;">
            Ce lien expire dans 24 heures pour des raisons de sécurité.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: 'Email de réinitialisation envoyé' }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in password-reset-request function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);