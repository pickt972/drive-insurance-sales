import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Définir des mots de passe de test simples
    const testPasswords = [
      { email: 'admin@aloelocation.internal', password: 'admin123' },
      { email: 'stef@aloelocation.internal', password: 'stef123' },
      { email: 'nadia@aloelocation.internal', password: 'nadia123' },
      { email: 'julie@aloelocation.internal', password: 'julie123' },
      { email: 'sherman@aloelocation.internal', password: 'sherman123' },
      { email: 'alvin@aloelocation.internal', password: 'alvin123' },
    ]

    const results = []

    for (const { email, password } of testPasswords) {
      // Récupérer l'utilisateur par email
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        results.push({ email, success: false, error: listError.message })
        continue
      }

      const user = users.find(u => u.email === email)
      
      if (!user) {
        results.push({ email, success: false, error: 'User not found' })
        continue
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password }
      )

      if (updateError) {
        results.push({ email, success: false, error: updateError.message })
      } else {
        results.push({ email, success: true, message: 'Password updated' })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Password reset completed',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
