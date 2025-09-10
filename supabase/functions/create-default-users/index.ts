import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const defaultUsers = [
  { username: 'admin', email: 'admin@aloelocation.com', password: 'admin2024', role: 'admin' },
  { username: 'julie', email: 'julie@aloelocation.com', password: 'julie2024', role: 'employee' },
  { username: 'sherman', email: 'sherman@aloelocation.com', password: 'sherman2024', role: 'employee' },
  { username: 'alvin', email: 'alvin@aloelocation.com', password: 'alvin2024', role: 'employee' },
  { username: 'stef', email: 'stef@aloelocation.com', password: 'stef2024', role: 'employee' },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .eq('username', userData.username)
          .single();

        if (existingProfile) {
          results.push({
            username: userData.username,
            success: true,
            message: 'Utilisateur déjà existant'
          });
          continue;
        }

        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        });

        if (authError) {
          results.push({
            username: userData.username,
            success: false,
            error: authError.message
          });
          continue;
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: authUser.user.id,
            username: userData.username,
            role: userData.role as 'admin' | 'employee'
          });

        if (profileError) {
          results.push({
            username: userData.username,
            success: false,
            error: profileError.message
          });
          continue;
        }

        results.push({
          username: userData.username,
          success: true,
          message: 'Utilisateur créé avec succès'
        });

      } catch (error: any) {
        results.push({
          username: userData.username,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ message: 'Traitement terminé', results }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in create-default-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);