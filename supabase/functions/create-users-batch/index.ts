import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const users = [
      { username: 'stef', firstName: 'Stef', lastName: '', role: 'admin', password: 'stef123' },
      { username: 'nadia', firstName: 'Nadia', lastName: '', role: 'admin', password: 'nadia123' },
      { username: 'julie', firstName: 'Julie', lastName: '', role: 'employee', password: 'julie123' },
      { username: 'sherman', firstName: 'Sherman', lastName: '', role: 'employee', password: 'sherman123' },
      { username: 'alvin', firstName: 'Alvin', lastName: '', role: 'employee', password: 'alvin123' },
    ];

    const results = [];
    
    for (const user of users) {
      const email = `${user.username}@aloelocation.internal`;
      
      console.log(`Creating user: ${user.username}`);
      
      // Créer l'utilisateur dans Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role
        }
      });

      if (authError) {
        console.error(`Error creating ${user.username}:`, authError);
        results.push({ username: user.username, success: false, error: authError.message });
        continue;
      }

      console.log(`✅ Auth user created for ${user.username}: ${authData.user.id}`);

      // Créer/mettre à jour le profil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
          is_active: true
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error(`Error creating profile for ${user.username}:`, profileError);
      }

      // Ajouter le rôle dans user_roles
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: authData.user.id,
          role: user.role
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        console.error(`Error creating role for ${user.username}:`, roleError);
      }

      results.push({ 
        username: user.username, 
        success: true, 
        email,
        userId: authData.user.id 
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erreur globale:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});