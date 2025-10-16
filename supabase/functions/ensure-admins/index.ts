import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json().catch(() => ({}));
    const usernames: string[] = Array.isArray(body?.usernames) && body.usernames.length > 0
      ? body.usernames
      : ["stef", "nadia"]; // valeurs par défaut

    const results: Array<{ username: string; success: boolean; message?: string; error?: string }> = [];

    for (const username of usernames) {
      try {
        // Récupérer le user_id depuis le profil
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, username")
          .eq("username", username)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile?.user_id) {
          results.push({ username, success: false, message: "Profil introuvable ou sans user_id" });
          continue;
        }

        // Upsert le rôle admin
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: profile.user_id, role: "admin" }, { onConflict: "user_id,role" });

        if (roleError) throw roleError;

        results.push({ username, success: true, message: "Rôle admin assuré" });
      } catch (e: any) {
        results.push({ username, success: false, error: e?.message ?? String(e) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});