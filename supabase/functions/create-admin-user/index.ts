import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log('Début création utilisateur admin...');

    // Vérifier s'il existe déjà un admin
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Erreur vérification admin existant:', checkError);
      throw new Error(`Erreur vérification: ${checkError.message}`);
    }

    if (existingAdmin && existingAdmin.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Un administrateur existe déjà: ${existingAdmin[0].username}`,
          existingAdmin: existingAdmin[0].username
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Créer l'utilisateur admin dans Supabase Auth
    const adminEmail = 'admin@aloelocation.com';
    const adminPassword = 'Admin123!';
    const adminUsername = 'admin';

    console.log('Création utilisateur auth...');
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        username: adminUsername
      }
    });

    if (authError) {
      console.error('Erreur création auth:', authError);
      throw new Error(`Erreur création auth: ${authError.message}`);
    }

    console.log('Utilisateur auth créé:', userData.user.id);

    // Créer le profil admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userData.user.id,
        username: adminUsername,
        role: 'admin',
        is_active: true
      });

    if (profileError) {
      console.error('Erreur création profil:', profileError);
      
      // Supprimer l'utilisateur auth si le profil a échoué
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      
      throw new Error(`Erreur création profil: ${profileError.message}`);
    }

    console.log('Profil admin créé avec succès');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Utilisateur administrateur créé avec succès',
        credentials: {
          username: adminUsername,
          email: adminEmail,
          password: adminPassword
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});