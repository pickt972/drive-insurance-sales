import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const InitializeUsers = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-default-users');
      
      if (error) {
        throw error;
      }

      console.log('Résultats:', data);
      toast({
        title: "Utilisateurs créés",
        description: "Les utilisateurs par défaut ont été créés dans Supabase",
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création des utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Initialiser les utilisateurs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Cliquez pour créer les utilisateurs par défaut dans Supabase :
        </p>
        <ul className="text-sm mb-4 space-y-1">
          <li>• admin / admin2024</li>
          <li>• julie / julie2024</li>
          <li>• sherman / sherman2024</li>
          <li>• alvin / alvin2024</li>
          <li>• stef / stef2024</li>
        </ul>
        <Button 
          onClick={createUsers} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Création...' : 'Créer les utilisateurs'}
        </Button>
      </CardContent>
    </Card>
  );
};