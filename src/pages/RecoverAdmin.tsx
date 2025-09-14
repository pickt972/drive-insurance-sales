import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, RefreshCw } from "lucide-react";

export const RecoverAdmin = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRecoverAdmin = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-default-users', {
        body: {}
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Récupération terminée",
        description: `Comptes admin recréés avec succès. Vous pouvez maintenant vous connecter avec admin / Admin123!`,
      });

      // Rediriger vers la page de connexion après un délai
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-primary">
            <Shield className="h-6 w-6" />
            Récupération Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>Vous avez supprimé votre compte admin par erreur ?</p>
            <p className="mt-2">Cliquez sur le bouton ci-dessous pour recréer les comptes par défaut.</p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Comptes qui seront recréés :</h4>
            <ul className="text-sm space-y-1">
              <li><strong>admin</strong> - Admin123!</li>
              <li><strong>Stef</strong> - Wilfried972</li>
            </ul>
          </div>

          <Button 
            onClick={handleRecoverAdmin} 
            disabled={loading}
            className="w-full bg-gradient-primary hover:bg-primary-hover"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Récupération en cours...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Recréer les comptes admin
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};