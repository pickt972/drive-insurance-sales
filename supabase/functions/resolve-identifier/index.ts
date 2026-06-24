import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { username } = await req.json();
    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ email: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clean = username.toLowerCase().trim();

    // 1) Try lookup by explicit username column
    const { data: byUsername } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .ilike('username', clean)
      .limit(1)
      .maybeSingle();

    if (byUsername?.email) {
      return new Response(
        JSON.stringify({ email: byUsername.email }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Fallback: lookup by email local-part prefix
    const { data: byPrefix } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .ilike('email', `${clean}@%`)
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify({ email: byPrefix?.email ?? null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('resolve-identifier unexpected:', error);
    return new Response(
      JSON.stringify({ email: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
