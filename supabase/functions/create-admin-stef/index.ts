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

    console.log("🔧 Création de l'admin Stef...");

    // Créer l'utilisateur Stef
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: "stef@aloelocation.internal",
      password: "stef123",
      email_confirm: true,
      user_metadata: {
        username: "stef",
        role: "admin",
        first_name: "Stef"
      }
    });

    if (userError) {
      console.error("❌ Erreur création utilisateur:", userError);
      // Si l'utilisateur existe déjà, on continue quand même
      if (!userError.message.includes("already been registered")) {
        throw userError;
      }
      console.log("ℹ️ Utilisateur existe déjà, on vérifie le profil et rôle...");
      
      // Récupérer l'utilisateur existant
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === "stef@aloelocation.internal");
      
      if (existingUser) {
        // S'assurer que le rôle admin existe
        await supabaseAdmin.from("user_roles").upsert({
          user_id: existingUser.id,
          role: "admin"
        }, { onConflict: "user_id,role" });
        
        console.log("✅ Rôle admin vérifié pour l'utilisateur existant");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Admin Stef existe déjà et le rôle a été vérifié",
            userId: existingUser.id
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (userData?.user) {
      console.log("✅ Utilisateur créé avec succès:", userData.user.id);
      console.log("✅ Le trigger a automatiquement créé le profil et le rôle admin");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin Stef créé avec succès",
          userId: userData.user.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Impossible de créer ou récupérer l'utilisateur");

  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message ?? String(error) 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
