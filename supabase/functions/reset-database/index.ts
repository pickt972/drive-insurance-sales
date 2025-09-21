import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: string;
          is_active: boolean;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          role?: string;
          is_active?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: string;
          is_active?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    console.log('Starting complete database reset...');

    // 1. Supprimer tous les utilisateurs auth existants (sauf les admins système)
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
    } else if (authUsers && authUsers.users) {
      for (const user of authUsers.users) {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteUserError) {
          console.error('Error deleting user:', user.id, deleteUserError);
        } else {
          console.log('Deleted auth user:', user.id);
        }
      }
    }

    // 2. Supprimer tous les profils existants
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)

    if (deleteProfilesError) {
      console.error('Error deleting profiles:', deleteProfilesError);
    } else {
      console.log('All profiles deleted successfully');
    }

    // 3. Supprimer toutes les ventes
    const { error: deleteSalesError } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteSalesError) {
      console.error('Error deleting sales:', deleteSalesError);
    } else {
      console.log('All sales deleted successfully');
    }

    // 4. Supprimer tous les objectifs
    const { error: deleteObjectivesError } = await supabase
      .from('employee_objectives')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteObjectivesError) {
      console.error('Error deleting objectives:', deleteObjectivesError);
    } else {
      console.log('All objectives deleted successfully');
    }

    // 5. Supprimer l'historique des objectifs
    const { error: deleteHistoryError } = await supabase
      .from('objective_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteHistoryError) {
      console.error('Error deleting objective history:', deleteHistoryError);
    } else {
      console.log('All objective history deleted successfully');
    }

    // 6. Nettoyer les tokens de réinitialisation
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (tokenError) {
      console.log('Note: Could not clean reset tokens (may not exist):', tokenError);
    } else {
      console.log('All reset tokens deleted successfully');
    }

    // 7. Créer un nouvel utilisateur admin dans auth
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: 'admin@aloelocation.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        username: 'admin'
      }
    });

    if (createUserError) {
      console.error('Error creating admin user:', createUserError);
      throw createUserError;
    }

    console.log('Admin user created successfully:', newUser.user?.id);

    // 8. Créer le profil admin
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        username: 'admin',
        role: 'admin',
        is_active: true,
        user_id: newUser.user?.id || null
      });

    if (insertError) {
      console.error('Error creating admin profile:', insertError);
      throw insertError;
    }

    console.log('Admin profile created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Base de données complètement nettoyée et admin recréé',
        admin_username: 'admin',
        admin_email: 'admin@aloelocation.com',
        admin_password: 'admin123'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in reset-database function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});