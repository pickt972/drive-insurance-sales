import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const InitializeUsers = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateUsers = async () => {
    setIsCreating(true);
    try {
      console.log('Creating users...');
      const { data, error } = await supabase.functions.invoke('create-default-users');
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('User creation results:', data);
      
      toast({
        title: "Utilisateurs créés",
        description: "Les utilisateurs par défaut ont été initialisés avec succès.",
      });
    } catch (error: any) {
      console.error('Error creating users:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="text-center mb-4">
      <Button
        onClick={handleCreateUsers}
        disabled={isCreating}
        variant="outline"
        size="sm"
      >
        {isCreating ? 'Création en cours...' : 'Créer les utilisateurs'}
      </Button>
    </div>
  );
};