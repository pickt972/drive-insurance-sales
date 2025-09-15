import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
}

interface UpdateUserRequest {
  username: string;
  newPassword?: string;
  newRole?: 'admin' | 'employee';
  userEmail?: string;
}

interface DeleteUserRequest {
  username: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'api',
      }
    });

    const { action, ...body } = await req.json();

    switch (action) {
      case 'create':
        return await createUser(supabaseAdmin, body as CreateUserRequest);
      
      case 'update':
        return await updateUser(supabaseAdmin, body as UpdateUserRequest);
      
      case 'delete':
        return await deleteUser(supabaseAdmin, body as DeleteUserRequest);
      
      case 'list':
        return await listUsers(supabaseAdmin);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Erreur dans user-management:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

async function createUser(supabaseAdmin: any, { username, email, password, role }: CreateUserRequest) {
  try {
    // Créer l'utilisateur dans Supabase Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    });

    if (authError) {
      throw new Error(`Erreur création auth: ${authError.message}`);
    }

    // Créer le profil dans la table profiles (schéma public)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userData.user.id,
        username,
        role
      })
      .select()
      .single();

    if (profileError) {
      // Si le profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      throw new Error(`Erreur création profil: ${profileError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        profile: profileData
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur createUser:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function updateUser(supabaseAdmin: any, { username, newPassword, newRole, userEmail }: UpdateUserRequest) {
  try {
    // Récupérer le profil utilisateur (schéma public)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      throw new Error('Utilisateur non trouvé');
    }

    // Mettre à jour le mot de passe si fourni
    if (newPassword) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.user_id,
        { password: newPassword }
      );

      if (passwordError) {
        throw new Error(`Erreur mise à jour mot de passe: ${passwordError.message}`);
      }

      // Envoyer email de notification si fourni
      if (userEmail) {
        try {
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'noreply@aloelocation.com',
                to: [userEmail],
                subject: 'Votre mot de passe a été modifié',
                html: `
                  <h2>Modification de mot de passe</h2>
                  <p>Bonjour,</p>
                  <p>Votre mot de passe pour le compte <strong>${username}</strong> a été modifié par un administrateur.</p>
                  <p>Si vous n'avez pas demandé cette modification, veuillez contacter votre administrateur.</p>
                `,
              }),
            });
          }
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError);
          // Ne pas faire échouer la requête pour une erreur d'email
        }
      }
    }

    // Mettre à jour le rôle si fourni (schéma public)
    if (newRole) {
      const { error: roleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('username', username);

      if (roleError) {
        throw new Error(`Erreur mise à jour rôle: ${roleError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur updateUser:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function deleteUser(supabaseAdmin: any, { username }: DeleteUserRequest) {
  try {
    // Vérifier d'abord qu'il ne s'agit pas du dernier administrateur
    const { data: adminCount, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'admin');

    if (countError) {
      throw new Error(`Erreur vérification admins: ${countError.message}`);
    }

    // Récupérer le profil utilisateur (schéma public)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      throw new Error('Utilisateur non trouvé');
    }

    // Empêcher la suppression du dernier administrateur
    if (profile.role === 'admin' && adminCount.length === 1) {
      throw new Error('Impossible de supprimer le dernier administrateur. Il doit y avoir au moins un administrateur.');
    }

    // Supprimer l'utilisateur (le profil sera supprimé automatiquement par la contrainte CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);

    if (deleteError) {
      throw new Error(`Erreur suppression: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function listUsers(supabaseAdmin: any) {
  try {
    // 1) Récupérer tous les utilisateurs Auth
    const { data: authList, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authError) throw new Error(`Erreur récupération utilisateurs (auth): ${authError.message}`);

    const authUsers = authList?.users || [];

    // 2) Charger les profils existants (schéma "api")
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) throw new Error(`Erreur récupération profils: ${profilesError.message}`);

    const existingByUserId = new Map(existingProfiles.map((p: any) => [p.user_id, p]));

    // 3) Créer les profils manquants pour les utilisateurs Auth
    const profilesToInsert = authUsers
      .filter((u: any) => !existingByUserId.has(u.id))
      .map((u: any) => {
        const username =
          (u.user_metadata && (u.user_metadata.username || u.user_metadata.name)) ||
          (u.email ? u.email.split('@')[0] : `user_${u.id.slice(0, 8)}`);
        const role =
          (u.user_metadata && (u.user_metadata.role === 'admin' ? 'admin' : 'employee')) || 'employee';
        return {
          user_id: u.id,
          username,
          role,
        };
      });

    if (profilesToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(profilesToInsert);

      if (insertError) {
        console.error('Erreur insertion profils manquants:', insertError);
        // On n'échoue pas pour autant la requête
      }
    }

    // 4) Retourner la liste complète des profils
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Erreur récupération utilisateurs: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ users: profiles }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Erreur listUsers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

serve(handler);