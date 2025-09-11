import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DefaultUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
}

const defaultUsers: DefaultUser[] = [
  {
    username: 'admin',
    email: 'admin@aloelocation.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    username: 'Julie',
    email: 'julie@aloelocation.com',
    password: 'Julie123!',
    role: 'employee'
  },
  {
    username: 'Sherman',
    email: 'sherman@aloelocation.com',
    password: 'Sherman123!',
    role: 'employee'
  },
  {
    username: 'Alvin',
    email: 'alvin@aloelocation.com',
    password: 'Alvin123!',
    role: 'employee'
  }
];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting default users creation process...');

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    const results = [];

    for (const user of defaultUsers) {
      console.log(`Processing user: ${user.username}`);

      try {
        // Check if profile exists without user_id
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, username')
          .eq('username', user.username)
          .maybeSingle();

        if (profileError) {
          console.error(`Error checking profile for ${user.username}:`, profileError);
          results.push({
            username: user.username,
            success: false,
            error: `Erreur profile: ${profileError.message}`
          });
          continue;
        }

        // If profile doesn't exist or already has user_id, skip
        if (!existingProfile) {
          results.push({
            username: user.username,
            success: false,
            error: 'Profil non trouvé'
          });
          continue;
        }

        if (existingProfile.user_id) {
          results.push({
            username: user.username,
            success: true,
            message: 'Utilisateur déjà activé'
          });
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            username: user.username,
            role: user.role
          }
        });

        if (authError) {
          console.error(`Error creating auth user for ${user.username}:`, authError);
          results.push({
            username: user.username,
            success: false,
            error: `Erreur auth: ${authError.message}`
          });
          continue;
        }

        if (!authData.user) {
          results.push({
            username: user.username,
            success: false,
            error: 'Utilisateur auth non créé'
          });
          continue;
        }

        console.log(`Auth user created for ${user.username}: ${authData.user.id}`);

        // Link profile to auth user
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            user_id: authData.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error(`Error linking profile for ${user.username}:`, updateError);
          results.push({
            username: user.username,
            success: false,
            error: `Erreur lien profil: ${updateError.message}`
          });
          continue;
        }

        console.log(`Successfully created and linked user: ${user.username}`);
        results.push({
          username: user.username,
          success: true,
          message: 'Utilisateur créé et lié avec succès',
          email: user.email,
          password: user.password
        });

      } catch (userError: any) {
        console.error(`Error processing user ${user.username}:`, userError);
        results.push({
          username: user.username,
          success: false,
          error: userError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`Process completed: ${successCount}/${totalCount} users processed successfully`);

    return new Response(
      JSON.stringify({
        message: `${successCount}/${totalCount} utilisateurs traités avec succès`,
        results
      }),
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