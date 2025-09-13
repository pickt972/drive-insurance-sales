import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cette fonction bloque complètement l'inscription publique
    // Seuls les admins peuvent créer des comptes via la fonction user-management
    
    return new Response(
      JSON.stringify({ 
        error: "L'inscription publique est désactivée. Contactez votre administrateur pour obtenir un compte.",
        code: "SIGNUP_DISABLED"
      }),
      { 
        status: 403,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Erreur lors de la vérification de sécurité",
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})