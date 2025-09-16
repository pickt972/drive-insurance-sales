import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getPreviousMonthRangeUTC() {
  const now = new Date();
  const firstOfCurrentUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const start = new Date(Date.UTC(firstOfCurrentUTC.getUTCFullYear(), firstOfCurrentUTC.getUTCMonth() - 1, 1, 0, 0, 0));
  const end = new Date(firstOfCurrentUTC.getTime() - 1); // last ms of previous month
  return { start, end };
}

async function buildMonthlyPdf(sales: any[], profilesMap: Map<string, string>, insMap: Map<string, string>) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  let y = 800;
  const lineHeight = 14;

  const title = "Récapitulatif des ventes (mois précédent)";
  page.drawText(title, { x: margin, y, size: 18, font, color: rgb(0,0,0) });
  y -= 26;

  const totalCommission = sales.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
  page.drawText(`Nombre total de ventes: ${sales.length}`, { x: margin, y, size: 12, font });
  y -= lineHeight;
  page.drawText(`Commission totale: ${totalCommission.toFixed(2)} €`, { x: margin, y, size: 12, font });
  y -= lineHeight * 1.5;

  // headers
  const headers = ["Date", "Employé", "Client", "Réservation", "Assurance", "Commission (€)"];
  const colX = [margin, 120, 220, 360, 430, 520];
  headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 10, font }));
  y -= lineHeight;

  for (const r of sales) {
    if (y < 60) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
      headers.forEach((h, i) => newPage.drawText(h, { x: colX[i], y, size: 10, font }));
      y -= lineHeight;
    }
    const dateStr = new Date(r.created_at).toLocaleDateString('fr-FR');
    const employee = profilesMap.get(r.employee_id) || r.employee_id;
    const insurance = insMap.get(r.insurance_type_id) || r.insurance_type_id;
    const row = [
      dateStr,
      employee,
      r.client_name || '',
      r.reservation_number || '',
      insurance,
      Number(r.commission_amount || 0).toFixed(2)
    ];
    row.forEach((text, i) => page.drawText(String(text).slice(0, 20), { x: colX[i], y, size: 10, font }));
    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  // Convert to base64
  let binary = '';
  const bytes = new Uint8Array(pdfBytes);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'public' } }
    );

    const { start, end } = getPreviousMonthRangeUTC();

    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at');

    if (salesError) throw salesError;

    const employeeIds = Array.from(new Set((sales || []).map((s: any) => s.employee_id)));
    const insuranceIds = Array.from(new Set((sales || []).map((s: any) => s.insurance_type_id)));

    const [{ data: profiles }, { data: insTypes }] = await Promise.all([
      supabaseAdmin.from('profiles').select('user_id, username').in('user_id', employeeIds),
      supabaseAdmin.from('insurance_types').select('id, name').in('id', insuranceIds),
    ]);

    const profilesMap = new Map<string, string>((profiles || []).map((p: any) => [p.user_id, p.username]));
    const insMap = new Map<string, string>((insTypes || []).map((i: any) => [i.id, i.name]));

    const base64 = await buildMonthlyPdf(sales || [], profilesMap, insMap);

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const fileName = `recap-ventes-${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}.pdf`;

    const emailResponse = await resend.emails.send({
      from: 'Aloe Reports <onboarding@resend.dev>',
      to: ['aloelocation@gmail.com'],
      subject: 'Récapitulatif mensuel des ventes (PDF)',
      html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint le récapitulatif des ventes du mois précédent.</p><p>Cordialement.</p>`,
      attachments: [
        {
          filename: fileName,
          content: base64,
        } as any,
      ],
    });

    console.log('Email sent:', emailResponse);

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('monthly-sales-report error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Erreur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});