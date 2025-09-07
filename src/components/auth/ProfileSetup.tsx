import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, CheckCircle } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

export const ProfileSetup = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);
  const { createUserProfile, user } = useSupabaseAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom d'utilisateur est requis",
        variant: "destructive",
      });
      return;
    }

    if (username.length < 2) {
      toast({
        title: "Erreur",
        description: "Le nom d'utilisateur doit contenir au moins 2 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const profile = await createUserProfile({
      username: username.trim(),
      role,
    });

    if (profile) {
      toast({
        title: "Profil créé !",
        description: "Bienvenue dans Aloelocation",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="mobile-container bg-gradient-hero">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-success mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">Finaliser votre profil</CardTitle>
            <p className="text-sm text-muted-foreground">
              Bonjour {user?.user_metadata?.full_name || user?.email} ! Complétez votre profil pour commencer.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: Julie, Sherman, Alvin..."
                  className="text-center"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'employee') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                type="submit"
                className="w-full primary-button"
                size="lg"
                disabled={loading}
              >
                <User className="mr-2 h-4 w-4" />
                {loading ? 'Création...' : 'Créer mon profil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};