import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordBody {
  token: string;
  username: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, username, newPassword }: ResetPasswordBody = await req.json();

    if (!token || !username || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Token, username et newPassword requis' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        db: { 
          schema: 'public' 
        }
      }
    );
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find and validate reset token using RPC
    const { data: resetTokens, error: tokenError } = await supabase
      .rpc('get_valid_reset_token', {
        p_token: token,
        p_username: username.toLowerCase().trim()
      });

    if (tokenError || !resetTokens || resetTokens.length === 0) {
      console.log('Token validation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token invalide ou expiré' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isArray = Array.isArray(resetTokens);
    const resetToken = isArray ? resetTokens[0] : resetTokens;

    // Update user password using Supabase Auth Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetToken.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.log('Password update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour du mot de passe' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used with RPC
    const { error: markUsedError } = await supabase
      .rpc('mark_reset_token_used', {
        p_token: token
      });

    if (markUsedError) {
      console.log('Error marking token as used:', markUsedError);
      // Continue anyway, password was updated successfully
    }

    console.log('Password successfully reset for user:', username);

    return new Response(
      JSON.stringify({ message: 'Mot de passe réinitialisé avec succès' }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in reset-password-with-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);