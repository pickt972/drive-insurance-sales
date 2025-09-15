import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Body {
  username: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username }: Body = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'username requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client admin (service role) pour accéder aux utilisateurs Auth directement
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rechercher l'utilisateur directement dans Auth par metadata.username ou prefixe d'email
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer la liste des utilisateurs" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uname = username.toLowerCase().trim();
    const found = (list?.users || []).find((u: any) => {
      const metaName = (u.user_metadata?.username || u.user_metadata?.name || '').toLowerCase().trim();
      const emailPrefix = (u.email || '').split('@')[0].toLowerCase();
      return metaName === uname || emailPrefix === uname;
    });

    if (!found?.email) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ email: found.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-user-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
