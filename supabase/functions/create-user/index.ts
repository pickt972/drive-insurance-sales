import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Strong password validation matching client-side rules
function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial' };
  }
  return { valid: true, message: '' };
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

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    
    if (!caller) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if caller is admin or manager
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)

    const callerRoleList = (callerRoles ?? []).map((r: any) => r.role)
    const isAdmin = callerRoleList.includes('admin')
    const isManager = callerRoleList.includes('manager')

    if (!isAdmin && !isManager) {
      return new Response(
        JSON.stringify({ success: false, error: 'Accès refusé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const body = await req.json()
    const { username, full_name, password, agency, phone } = body
    // Managers can only create standard employees
    const role = isManager && !isAdmin ? 'user' : (body.role ?? 'user')

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nom d\'utilisateur et mot de passe requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: passwordValidation.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const cleanUsername = String(username).toLowerCase().trim()
    // Generate email from username
    const email = `${cleanUsername}@aloelocation.internal`

    // Check if username/email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`email.eq.${email},username.eq.${cleanUsername}`)
      .maybeSingle()

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ce nom d\'utilisateur existe déjà' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create user with Supabase Auth Admin
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || username,
        role,
        agency: agency || null,
        username: cleanUsername,
      }
    })


    if (authError) {
      console.error('Error creating user:', authError)
      
      if (authError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cet email est déjà utilisé' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Ensure profile has username + phone set
    if (newUser.user) {
      await supabaseAdmin
        .from('profiles')
        .update({ username: cleanUsername, ...(phone ? { phone } : {}) })
        .eq('id', newUser.user.id)
    }


    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user?.id,
        username,
        email,
        full_name: full_name || username,
        role,
        agency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
