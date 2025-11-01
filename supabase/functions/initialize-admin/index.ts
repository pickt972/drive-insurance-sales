import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const adminEmail = 'admin@aloelocation.internal'
    const adminPassword = 'admin123'
    const adminUsername = 'admin'

    // Vérifier si l'utilisateur auth existe déjà
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const adminAuthUser = existingAuthUser?.users?.find(u => u.email === adminEmail)

    let adminId: string

    if (adminAuthUser) {
      // L'utilisateur existe déjà dans auth.users
      adminId = adminAuthUser.id
    } else {
      // Créer l'utilisateur admin
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          username: adminUsername,
          first_name: 'Admin',
          last_name: 'System',
          role: 'admin'
        }
      })

      if (authError) {
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      adminId = newUser.user.id
    }

    // S'assurer que le profil et le rôle existent (idempotent - fonctionne même si déjà créés)

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: adminId,
        username: adminUsername,
        first_name: 'Admin',
        last_name: 'System',
        role: 'admin',
        is_active: true
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Erreur upsert profil admin:', profileError);
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: adminId, role: 'admin' }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('Erreur upsert rôle admin:', roleError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin initialisé avec succès',
        username: adminUsername,
        email: adminEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
