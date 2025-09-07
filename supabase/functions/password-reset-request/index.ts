import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetRequestBody {
  username: string;
  origin?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, origin }: ResetRequestBody = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: "username is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_RESET_EMAIL");

    if (!resendApiKey || !adminEmail) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY or ADMIN_RESET_EMAIL secret" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    const subject = `Demande de réinitialisation de mot de passe - ${username}`;
    const html = `
      <h2>Nouvelle demande de réinitialisation</h2>
      <p><strong>Utilisateur:</strong> ${username}</p>
      ${origin ? `<p><strong>Application:</strong> ${origin}</p>` : ""}
      <p>Veuillez prendre contact avec l'utilisateur et procéder à la réinitialisation de son mot de passe.</p>
      <p style="color:#888">Email envoyé automatiquement par Aloelocation.</p>
    `;

    const { error } = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [adminEmail],
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("password-reset-request error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});