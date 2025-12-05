import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  username: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Password reset request received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, message }: PasswordResetRequest = await req.json();
    console.log("Request for username:", username);

    if (!username?.trim()) {
      return new Response(
        JSON.stringify({ error: "Le nom d'utilisateur est requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin email from system_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingData, error: settingError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "admin_reset_email")
      .single();

    if (settingError || !settingData?.value) {
      console.error("Admin email not configured:", settingError);
      return new Response(
        JSON.stringify({ error: "L'email administrateur n'est pas configuré" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminEmail = settingData.value as string;
    console.log("Sending to admin email:", adminEmail);

    // Get app name for email
    const { data: appNameData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "app_name")
      .single();

    const appName = appNameData?.value || "Gestion des Ventes";

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: [adminEmail],
      subject: `🔐 Demande de réinitialisation de mot de passe - ${username}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
            .footer { background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
            .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .username { font-size: 24px; font-weight: bold; color: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Demande de réinitialisation</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Un utilisateur a demandé la réinitialisation de son mot de passe :</p>
              <div class="highlight">
                <p><strong>Utilisateur :</strong> <span class="username">${username}</span></p>
                <p><strong>Email :</strong> ${username}@aloelocation.internal</p>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'America/Martinique' })}</p>
                ${message ? `<p><strong>Message :</strong> ${message}</p>` : ''}
              </div>
              <p>Veuillez vous connecter à l'interface d'administration pour réinitialiser le mot de passe de cet utilisateur.</p>
              <p>Cordialement,<br><strong>${appName}</strong></p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par ${appName}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Demande envoyée avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset-request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'envoi" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
