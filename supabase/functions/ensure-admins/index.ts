import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: retry wrapper for transient PostgREST schema cache errors
async function retryRest<T>(fn: () => Promise<{ data: T; error: any }>, attempts = 3, baseDelay = 400): Promise<{ data: T; error: any }> {
  let last: any = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fn();
    if (!res.error) return res;
    const msg = String(res.error?.message ?? res.error);
    if (msg.includes("schema cache") || msg.includes("PGRST002") || msg.includes("503")) {
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
      last = res.error;
      continue;
    }
    return res; // non-retryable error
  }
  return { data: null as unknown as T, error: last };
}

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

    // Fetch users once to map username from email local-part (before @)
    const usersPage = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const allUsers = usersPage?.data?.users ?? [];

    for (const username of usernames) {
      try {
        // 1) Récupérer le profil (avec retry sur erreurs de cache)
        const profRes = await retryRest(() =>
          supabaseAdmin
            .from("profiles")
            .select("user_id, username")
            .eq("username", username)
            .maybeSingle()
        );
        if (profRes.error) throw profRes.error;
        let profile = profRes.data as { user_id: string | null; username: string } | null;

        // 2) Si pas de user_id lié, tenter de le lier via auth.users (email local-part == username)
        if (!profile || !profile.user_id) {
          const matching = allUsers.find(u => (u.email ?? "").split("@")[0] === username);
          if (matching?.id) {
            const upd = await retryRest(() =>
              supabaseAdmin
                .from("profiles")
                .update({ user_id: matching.id, is_active: true, updated_at: new Date().toISOString() })
                .eq("username", username)
                .is("user_id", null)
                .select("user_id, username")
                .maybeSingle()
            );
            if (upd.error) throw upd.error;
            profile = upd.data as { user_id: string | null; username: string } | null;
          }
        }

        if (!profile?.user_id) {
          results.push({ username, success: false, message: "Profil introuvable ou sans user_id (et aucun utilisateur auth correspondant)" });
          continue;
        }

        // 3) Upsert le rôle admin (idempotent, avec retry)
        const roleRes = await retryRest(() =>
          supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: profile!.user_id as string, role: "admin" }, { onConflict: "user_id,role" })
        );
        if (roleRes.error) throw roleRes.error;

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
