import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateTokenBody {
  token: string;
  username: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, username }: ValidateTokenBody = await req.json();

    if (!token || !username) {
      return new Response(
        JSON.stringify({ error: 'Token and username are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Use the RPC function to validate reset token
    const { data: resetTokens, error: tokenError } = await supabase
      .rpc('get_valid_reset_token', {
        p_token: token,
        p_username: username
      });

    const isArray = Array.isArray(resetTokens);
    const tokenRow = isArray ? resetTokens[0] : resetTokens;

    if (tokenError || !tokenRow) {
      console.log('Token validation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token invalide ou expiré' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in validate-reset-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);