import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportBody {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  userIds?: string[];
  format?: 'pdf';
}

async function buildPdf(title: string, rows: any[], profilesMap: Map<string, string>, insMap: Map<string, string>) {
  console.log(`Building PDF with ${rows.length} rows`);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  let y = 800;
  const lineHeight = 14;

  page.drawText(title, { x: margin, y, size: 18, font, color: rgb(0,0,0) });
  y -= 26;

  const totalCommission = rows.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
  page.drawText(`Nombre total de ventes: ${rows.length}`, { x: margin, y, size: 12, font });
  y -= lineHeight;
  page.drawText(`Commission totale: ${totalCommission.toFixed(2)} €`, { x: margin, y, size: 12, font });
  y -= lineHeight * 1.5;

  const headers = ["Date", "Employé", "Client", "Réservation", "Assurance", "Commission (€)"];
  const colX = [margin, 120, 220, 360, 430, 520];
  headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 10, font }));
  y -= lineHeight;

  for (const r of rows) {
    if (y < 60) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
      headers.forEach((h, i) => newPage.drawText(h, { x: colX[i], y, size: 10, font }));
      y -= lineHeight;
    }
    const dateStr = new Date(r.created_at).toLocaleDateString('fr-FR');
    const employee = profilesMap.get(r.employee_id) || r.employee_id;
    const insurance = insMap.get(r.insurance_type_id) || r.insurance_type_id;
    const row = [dateStr, employee, r.client_name || '', r.reservation_number || '', insurance, Number(r.commission_amount || 0).toFixed(2)];
    row.forEach((text, i) => page.drawText(String(text).slice(0, 20), { x: colX[i], y, size: 10, font }));
    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  let binary = '';
  const bytes = new Uint8Array(pdfBytes);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    console.log('Export sales report function called');
    const body: ExportBody = await req.json();
    console.log('Request body:', body);
    const { startDate, endDate, userIds } = body;

    if (!startDate || !endDate) {
      console.log('Missing startDate or endDate');
      return new Response(JSON.stringify({ error: 'startDate et endDate requis' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Pour simplifier, nous allons utiliser le service role directement
    // car l'authentification locale n'est pas compatible avec Supabase auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'public' } }
    );

    console.log('Querying sales with date range:', startDate, 'to', endDate);
    let query = supabaseAdmin.from('sales').select('*')
      .gte('created_at', new Date(startDate).toISOString())
      .lte('created_at', new Date(new Date(endDate).getTime() + 24*3600*1000 - 1).toISOString());

    // Si des utilisateurs spécifiques sont demandés, filtrer par leurs IDs
    if (userIds && userIds.length > 0) {
      console.log('Filtering by user IDs:', userIds);
      query = query.in('employee_id', userIds);
    }

    const { data: sales, error: salesError } = await query.order('created_at');
    if (salesError) {
      console.error('Sales query error:', salesError);
      throw salesError;
    }
    console.log(`Found ${sales?.length || 0} sales records`);

    const employeeIds = Array.from(new Set((sales || []).map((s: any) => s.employee_id)));
    const insuranceIds = Array.from(new Set((sales || []).map((s: any) => s.insurance_type_id)));
    console.log('Employee IDs:', employeeIds);
    console.log('Insurance type IDs:', insuranceIds);

    const [{ data: profiles }, { data: insTypes }] = await Promise.all([
      supabaseAdmin.from('profiles').select('user_id, username').in('user_id', employeeIds),
      supabaseAdmin.from('insurance_types').select('id, name').in('id', insuranceIds),
    ]);

    console.log('Profiles:', profiles);
    console.log('Insurance types:', insTypes);

    const profilesMap = new Map<string, string>((profiles || []).map((p: any) => [p.user_id, p.username]));
    const insMap = new Map<string, string>((insTypes || []).map((i: any) => [i.id, i.name]));

    const title = `Export des ventes du ${startDate} au ${endDate}`;
    console.log('Generating PDF...');
    const base64 = await buildPdf(title, sales || [], profilesMap, insMap);
    console.log('PDF generated successfully');

    const fileName = `export-ventes-${startDate}_au_${endDate}.pdf`;
    return new Response(JSON.stringify({ fileName, fileData: base64 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('export-sales-report error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Erreur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});