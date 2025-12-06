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

// Rate limit: max 3 requests per username per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

// HTML escape to prevent XSS in email templates
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// Validate username format (alphanumeric and basic chars only)
function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._-]{1,50}$/.test(username);
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

    // Validate username
    const trimmedUsername = username?.trim();
    if (!trimmedUsername) {
      return new Response(
        JSON.stringify({ error: "Le nom d'utilisateur est requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate username format
    if (!isValidUsername(trimmedUsername)) {
      return new Response(
        JSON.stringify({ error: "Format de nom d'utilisateur invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize and limit message
    const sanitizedMessage = message ? escapeHtml(message.slice(0, 500).trim()) : '';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting check using audit_logs
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { data: recentRequests, error: rateError } = await supabase
      .from("audit_logs")
      .select("id")
      .eq("action", "PASSWORD_RESET_REQUEST")
      .eq("record_id", trimmedUsername.toLowerCase())
      .gte("created_at", oneHourAgo);

    if (!rateError && recentRequests && recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      console.log(`Rate limit exceeded for username: ${trimmedUsername}`);
      return new Response(
        JSON.stringify({ error: "Trop de demandes. Veuillez réessayer dans une heure." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log this request for rate limiting (before sending email)
    await supabase.from("audit_logs").insert({
      action: "PASSWORD_RESET_REQUEST",
      record_id: trimmedUsername.toLowerCase(),
      table_name: "password_reset",
      new_values: { username: trimmedUsername, has_message: !!sanitizedMessage },
    });

    // Get admin email from system_settings
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

    const appName = escapeHtml(String(appNameData?.value || "Gestion des Ventes"));

    // Get sender email from system_settings (for verified domain)
    const { data: senderEmailData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "sender_email")
      .single();

    // Use configured sender email or fallback to resend.dev
    const senderEmail = senderEmailData?.value || "onboarding@resend.dev";
    console.log("Using sender email:", senderEmail);

    // Escape username for HTML
    const safeUsername = escapeHtml(trimmedUsername);

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: `${appName} <${senderEmail}>`,
      to: [adminEmail],
      subject: `🔐 Demande de réinitialisation de mot de passe - ${safeUsername}`,
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
                <p><strong>Utilisateur :</strong> <span class="username">${safeUsername}</span></p>
                <p><strong>Email :</strong> ${safeUsername}@aloelocation.internal</p>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'America/Martinique' })}</p>
                ${sanitizedMessage ? `<p><strong>Message :</strong> ${sanitizedMessage}</p>` : ''}
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
      JSON.stringify({ error: "Erreur lors de l'envoi de la demande" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
