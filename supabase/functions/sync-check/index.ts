import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier l'intégrité des données
    const checks = await Promise.all([
      // Compter les profils
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      // Compter les types d'assurance actifs
      supabase.from('insurance_types').select('*', { count: 'exact', head: true }).eq('is_active', true),
      // Compter les ventes actives
      supabase.from('sales').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    const profilesCount = checks[0].count || 0;
    const insuranceTypesCount = checks[1].count || 0;
    const salesCount = checks[2].count || 0;

    // Valeurs attendues
    const expectedProfiles = 5; // admin, Julie, Sherman, Alvin, Stef
    const expectedInsuranceTypes = 6;

    const status = {
      healthy: profilesCount >= expectedProfiles && insuranceTypesCount >= expectedInsuranceTypes,
      profiles: {
        count: profilesCount,
        expected: expectedProfiles,
        status: profilesCount >= expectedProfiles ? 'OK' : 'MISSING'
      },
      insuranceTypes: {
        count: insuranceTypesCount,
        expected: expectedInsuranceTypes,
        status: insuranceTypesCount >= expectedInsuranceTypes ? 'OK' : 'MISSING'
      },
      sales: {
        count: salesCount,
        status: 'INFO'
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(status),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);