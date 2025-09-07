import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Chrome } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export const LoginPage = () => {
  const { signInWithGoogle, loading } = useSupabaseAuth();

  return (
    <div className="mobile-container bg-gradient-hero">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-elevated">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
              <Car className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Aloelocation</h1>
              <p className="text-muted-foreground text-sm">
                Suivi des ventes d'assurances
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Se connecter</h2>
              <p className="text-sm text-muted-foreground">
                Connectez-vous avec votre compte Google pour accéder à votre espace de vente
              </p>
            </div>
            
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              size="lg"
            >
              <Chrome className="mr-2 h-5 w-5" />
              {loading ? 'Connexion...' : 'Continuer avec Google'}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                En vous connectant, vous acceptez nos conditions d'utilisation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};