import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  username: string;
  newPassword: string;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Admin reset password request received');
    
    const { username, newPassword, userEmail }: ResetPasswordRequest = await req.json();

    if (!username || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Username and new password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user profile to find the user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user password using admin client
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send email notification to user if email is provided
    if (userEmail) {
      try {
        await resend.emails.send({
          from: "Aloelocation <noreply@resend.dev>",
          to: [userEmail],
          subject: "Votre mot de passe a été réinitialisé",
          html: `
            <h1>Mot de passe réinitialisé</h1>
            <p>Bonjour ${username},</p>
            <p>Votre mot de passe a été réinitialisé par l'administrateur.</p>
            <p>Votre nouveau mot de passe est: <strong>${newPassword}</strong></p>
            <p>Veuillez vous connecter avec ce nouveau mot de passe et le changer immédiatement après votre connexion.</p>
            <p>Cordialement,<br>L'équipe Aloelocation</p>
          `,
        });
        console.log('Password reset email sent to user');
      } catch (emailError) {
        console.error('Error sending email to user:', emailError);
        // Don't fail the entire operation if email fails
      }
    }

    console.log('Password updated successfully for user:', username);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('admin-reset-password error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);