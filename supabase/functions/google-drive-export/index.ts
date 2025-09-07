import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaleData {
  date: string;
  employee: string;
  client: string;
  email: string;
  phone: string;
  reservation: string;
  insurance: string;
  commission: number;
  notes: string;
}

interface ExportRequest {
  sales: SaleData[];
  credentials: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
  };
  filename: string;
}

async function getAccessToken(credentials: any) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function createCSVContent(sales: SaleData[]): Promise<string> {
  const headers = ["Date", "Employé", "Client", "Email", "Téléphone", "N° Réservation", "Assurance", "Commission", "Notes"];
  const csvContent = [
    headers.join(","),
    ...sales.map(sale => [
      sale.date,
      sale.employee,
      sale.client,
      sale.email,
      sale.phone,
      sale.reservation,
      sale.insurance,
      sale.commission,
      `"${sale.notes.replace(/"/g, '""')}"`,
    ].join(","))
  ].join("\n");

  return csvContent;
}

async function uploadToGoogleDrive(
  accessToken: string,
  filename: string,
  content: string
): Promise<any> {
  // Créer les métadonnées du fichier
  const metadata = {
    name: `${filename}.csv`,
    parents: [], // Laisser vide pour uploader à la racine
  };

  // Créer le contenu multipart
  const delimiter = '-------314159265358979323846';
  const close_delim = `\r\n--${delimiter}--`;
  
  let body = `--${delimiter}\r\n`;
  body += 'Content-Type: application/json\r\n\r\n';
  body += JSON.stringify(metadata) + '\r\n';
  body += `--${delimiter}\r\n`;
  body += 'Content-Type: text/csv\r\n\r\n';
  body += content;
  body += close_delim;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${delimiter}"`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive API error:', errorText);
    throw new Error(`Failed to upload to Google Drive: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Google Drive export...');
    
    const { sales, credentials, filename }: ExportRequest = await req.json();

    // Validation
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      throw new Error('No sales data provided');
    }

    if (!credentials || !credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
      throw new Error('Invalid Google Drive credentials');
    }

    console.log(`Processing ${sales.length} sales records...`);

    // Obtenir le token d'accès
    const accessToken = await getAccessToken(credentials);
    console.log('Access token obtained successfully');

    // Créer le contenu CSV
    const csvContent = await createCSVContent(sales);
    console.log('CSV content generated');

    // Uploader vers Google Drive
    const result = await uploadToGoogleDrive(accessToken, filename, csvContent);
    console.log('File uploaded to Google Drive:', result.id);

    return new Response(JSON.stringify({
      success: true,
      fileName: result.name,
      fileId: result.id,
      message: `Fichier ${result.name} envoyé avec succès vers Google Drive`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-export function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});