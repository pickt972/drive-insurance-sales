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

    // Vérifier si un admin existe déjà
    const { data: existingAdmin } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ success: true, message: 'Admin déjà existant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer l'utilisateur admin
    const adminEmail = 'admin@aloelocation.internal'
    const adminPassword = 'admin123'
    const adminUsername = 'admin'

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
      console.error('Erreur création admin:', authError)
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Admin créé avec succès:', newUser.user.id)

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
