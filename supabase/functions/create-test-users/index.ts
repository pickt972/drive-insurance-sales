import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserToCreate {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'user'
  agency?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    // Utilisateurs à créer
    const usersToCreate: UserToCreate[] = [
      {
        email: 'admin@aloelocation.internal',
        password: 'Admin2024!',
        full_name: 'Administrateur',
        role: 'admin'
      },
      {
        email: 'stef@aloelocation.internal',
        password: 'Stef2024!',
        full_name: 'Stéphane',
        role: 'admin'
      },
      {
        email: 'nadia@aloelocation.internal',
        password: 'Nadia2024!',
        full_name: 'Nadia',
        role: 'admin'
      },
      {
        email: 'marie@aloelocation.internal',
        password: 'Marie2024!',
        full_name: 'Marie Duval',
        role: 'user',
        agency: 'Trinité'
      },
      {
        email: 'jean@aloelocation.internal',
        password: 'Jean2024!',
        full_name: 'Jean Robert',
        role: 'user',
        agency: 'Le Lamentin'
      },
      {
        email: 'sophie@aloelocation.internal',
        password: 'Sophie2024!',
        full_name: 'Sophie Martin',
        role: 'user',
        agency: 'Trinité'
      },
      {
        email: 'julie@aloelocation.internal',
        password: 'Julie2024!',
        full_name: 'Julie Lefebvre',
        role: 'user',
        agency: 'Le Lamentin'
      }
    ]

    const results = []

    for (const user of usersToCreate) {
      try {
        // Créer l'utilisateur dans auth.users
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
            agency: user.agency
          }
        })

        if (authError) {
          console.error(`Erreur création ${user.email}:`, authError)
          results.push({
            email: user.email,
            success: false,
            error: authError.message
          })
          continue
        }

        console.log(`✅ Utilisateur créé: ${user.email}`)
        results.push({
          email: user.email,
          success: true,
          id: authData.user?.id
        })

      } catch (err) {
        console.error(`Erreur inattendue pour ${user.email}:`, err)
        results.push({
          email: user.email,
          success: false,
          error: err.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Création terminée: ${successCount} succès, ${failCount} échecs`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Erreur globale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
