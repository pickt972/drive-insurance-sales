import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Client admin pour créer des utilisateurs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const defaultUsers = [
      { email: 'admin@aloelocation.com', password: 'admin2024', username: 'admin', role: 'admin' },
      { email: 'julie@aloelocation.com', password: 'julie2024', username: 'julie', role: 'employee' },
      { email: 'sherman@aloelocation.com', password: 'sherman2024', username: 'sherman', role: 'employee' },
      { email: 'alvin@aloelocation.com', password: 'alvin2024', username: 'alvin', role: 'employee' },
      { email: 'stef@aloelocation.com', password: 'stef2024', username: 'stef', role: 'employee' },
    ];

    const results = [];

    for (const user of defaultUsers) {
      try {
        // Créer l'utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError && !authError.message.includes('already')) {
          console.error(`Erreur création utilisateur ${user.username}:`, authError);
          results.push({
            username: user.username,
            success: false,
            error: authError.message,
          });
          continue;
        }

        if (authData.user) {
          // Créer le profil associé
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              user_id: authData.user.id,
              username: user.username,
              role: user.role as 'admin' | 'employee',
              is_active: true,
            });

          if (profileError) {
            console.error(`Erreur création profil ${user.username}:`, profileError);
            results.push({
              username: user.username,
              success: false,
              error: profileError.message,
            });
          } else {
            results.push({
              username: user.username,
              success: true,
              user_id: authData.user.id,
            });
          }
        } else {
          results.push({
            username: user.username,
            success: true,
            message: 'Utilisateur déjà existant',
          });
        }
      } catch (error: any) {
        console.error(`Erreur pour ${user.username}:`, error);
        results.push({
          username: user.username,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Traitement terminé',
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erreur globale:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);